import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { RowDataPacket } from 'mysql2';

// GET a specific subscription plan by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== 'ADMIN')) {
      console.log("Subscription Plan API - Unauthorized access - Role:", session?.user.role);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = params.id;
    console.log("Fetching subscription plan with ID:", planId);

    // Fetch subscription plan
    const [planRows] = await pool.query(
      `SELECT * FROM subscription_plans WHERE id = ?`,
      [planId]
    ) as [RowDataPacket[], any];

    if (planRows.length === 0) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    const plan = planRows[0];

    // Get vendor count using this plan
    const [vendorCountRows] = await pool.query(
      `SELECT COUNT(*) as count FROM vendors WHERE subscriptionPlanId = ?`,
      [planId]
    ) as [RowDataPacket[], any];
    
    const vendorCount = vendorCountRows[0].count;

    // Fetch plan features from the plan_features table
    const [planFeaturesRows] = await pool.query(
      `SELECT pf.*, m.name as moduleName, m.description as moduleDescription, m.type as moduleType 
       FROM plan_features pf
       LEFT JOIN modules m ON pf.moduleId = m.id
       WHERE pf.planId = ?`,
      [planId]
    ) as [RowDataPacket[], any];

    // Convert features to object format for backward compatibility with the UI
    const featuresObj: Record<string, boolean> = {};
    
    // First check if there's a JSON features field in the plan
    if (plan.features) {
      try {
        const existingFeatures = JSON.parse(plan.features);
        Object.assign(featuresObj, existingFeatures);
      } catch (error) {
        console.error('Error parsing JSON features:', error);
      }
    }
    
    // Then add features from plan_features table
    for (const feature of planFeaturesRows) {
      featuresObj[feature.moduleId] = feature.isIncluded === 1;
    }

    // Format plan data
    const formattedPlan = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: parseFloat(plan.price),
      billingCycle: plan.billingCycle,
      isActive: Boolean(plan.isActive),
      features: featuresObj,
      planFeatures: planFeaturesRows.map(feature => ({
        id: feature.id,
        moduleId: feature.moduleId,
        moduleName: feature.moduleName,
        moduleDescription: feature.moduleDescription,
        moduleType: feature.moduleType,
        isIncluded: Boolean(feature.isIncluded),
        limits: feature.limits ? JSON.parse(feature.limits) : {}
      })),
      vendorCount: vendorCount,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    };

    return NextResponse.json({ plan: formattedPlan });
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plan' },
      { status: 500 }
    );
  }
}

// PUT to update a subscription plan
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = params.id;
    const body = await req.json();
    
    const { 
      name, 
      description, 
      price, 
      billingCycle, 
      isActive, 
      features 
    } = body;

    // Check if plan exists
    const [planRows] = await pool.query(
      `SELECT * FROM subscription_plans WHERE id = ?`,
      [planId]
    ) as [RowDataPacket[], any];

    if (planRows.length === 0) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    const plan = planRows[0];

    // Validate required fields
    if (!name || price === undefined || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate price
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!['monthly', 'quarterly', 'biannually', 'annually'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    // Start a transaction to update both subscription_plans and plan_features tables
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update the subscription plan
      const featuresJSON = features ? JSON.stringify(features) : plan.features;
      
      await connection.query(
        `UPDATE subscription_plans 
         SET name = ?, description = ?, price = ?, billingCycle = ?, isActive = ?, features = ?
         WHERE id = ?`,
        [
          name,
          description || '',
          price,
          billingCycle,
          isActive !== undefined ? isActive : plan.isActive,
          featuresJSON,
          planId
        ]
      );

      // Process features and update plan_features table
      if (features && typeof features === 'object') {
        // Get all existing modules
        const [modulesRows] = await connection.query(
          `SELECT id FROM modules`
        ) as [RowDataPacket[], any];
        
        const moduleIds = modulesRows.map(m => m.id);
        
        // Delete existing features that are not needed anymore
        await connection.query(
          `DELETE FROM plan_features 
           WHERE planId = ? AND moduleId NOT IN (${moduleIds.map(() => '?').join(',')})`,
          [planId, ...moduleIds]
        );

        // Update or insert features for each module
        for (const [moduleId, isIncluded] of Object.entries(features)) {
          if (!moduleIds.includes(moduleId)) {
            continue; // Skip if module doesn't exist
          }

          // Check if this plan_feature already exists
          const [existingFeature] = await connection.query(
            `SELECT id FROM plan_features WHERE planId = ? AND moduleId = ?`,
            [planId, moduleId]
          ) as [RowDataPacket[], any];

          if (existingFeature.length > 0) {
            // Update existing feature
            await connection.query(
              `UPDATE plan_features SET isIncluded = ? WHERE id = ?`,
              [isIncluded ? 1 : 0, existingFeature[0].id]
            );
          } else {
            // Insert new feature
            await connection.query(
              `INSERT INTO plan_features (planId, moduleId, isIncluded) VALUES (?, ?, ?)`,
              [planId, moduleId, isIncluded ? 1 : 0]
            );
          }
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    // Fetch the updated plan
    const [updatedPlanRows] = await pool.query(
      `SELECT * FROM subscription_plans WHERE id = ?`,
      [planId]
    ) as [RowDataPacket[], any];
    
    if (updatedPlanRows.length === 0) {
      return NextResponse.json({ error: 'Failed to retrieve updated plan' }, { status: 500 });
    }
    
    const updatedPlan = updatedPlanRows[0];
    
    // Get vendor count using this plan
    const [vendorCountRows] = await pool.query(
      `SELECT COUNT(*) as count FROM vendors WHERE subscriptionPlanId = ?`,
      [planId]
    ) as [RowDataPacket[], any];
    
    const vendorCount = vendorCountRows[0].count;

    // Fetch updated plan features
    const [planFeaturesRows] = await pool.query(
      `SELECT pf.*, m.name as moduleName, m.description as moduleDescription, m.type as moduleType 
       FROM plan_features pf
       LEFT JOIN modules m ON pf.moduleId = m.id
       WHERE pf.planId = ?`,
      [planId]
    ) as [RowDataPacket[], any];

    // Parse stored features for backward compatibility
    let featuresObject: Record<string, boolean> = {};
    try {
      if (updatedPlan.features) {
        featuresObject = JSON.parse(updatedPlan.features);
      }
    } catch (error) {
      console.error('Error parsing features:', error);
    }

    // Format response
    const formattedPlan = {
      id: updatedPlan.id,
      name: updatedPlan.name,
      description: updatedPlan.description,
      price: parseFloat(updatedPlan.price),
      billingCycle: updatedPlan.billingCycle,
      isActive: Boolean(updatedPlan.isActive),
      features: featuresObject,
      planFeatures: planFeaturesRows.map(feature => ({
        id: feature.id,
        moduleId: feature.moduleId,
        moduleName: feature.moduleName,
        moduleDescription: feature.moduleDescription,
        moduleType: feature.moduleType,
        isIncluded: Boolean(feature.isIncluded),
        limits: feature.limits ? JSON.parse(feature.limits) : {}
      })),
      vendorCount: vendorCount,
      createdAt: updatedPlan.createdAt,
      updatedAt: updatedPlan.updatedAt
    };

    return NextResponse.json({ plan: formattedPlan });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    );
  }
}

// DELETE a subscription plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = params.id;

    // Check if plan exists
    const [planRows] = await pool.query(
      `SELECT * FROM subscription_plans WHERE id = ?`,
      [planId]
    ) as [RowDataPacket[], any];

    if (planRows.length === 0) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    // Check if plan is being used by vendors
    const [vendorRows] = await pool.query(
      `SELECT COUNT(*) as count FROM vendors WHERE subscriptionPlanId = ?`,
      [planId]
    ) as [RowDataPacket[], any];
    
    const vendorCount = vendorRows[0].count;
    
    if (vendorCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan as it is being used by vendors', vendorCount },
        { status: 400 }
      );
    }

    // Start a transaction to delete from both tables
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Delete associated plan features
      await connection.query(
        `DELETE FROM plan_features WHERE planId = ?`,
        [planId]
      );
      
      // Delete the plan
      await connection.query(
        `DELETE FROM subscription_plans WHERE id = ?`,
        [planId]
      );
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return NextResponse.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription plan' },
      { status: 500 }
    );
  }
}