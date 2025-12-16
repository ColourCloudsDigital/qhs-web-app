import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Interface for features object
interface FeaturesObject {
  [key: string]: boolean | string | number;
}

/**
 * GET /api/public/subscription-plans
 * Public endpoint to fetch active subscription plans
 */
export async function GET() {
  try {
    // Query to get all active plans
    const [plans] = await pool.query(`
      SELECT * FROM subscription_plans 
      WHERE isActive = TRUE 
      ORDER BY price ASC
    `);

    // Process each plan to parse the features JSON
    const formattedPlans = await Promise.all((plans as any[]).map(async (plan) => {
      // Get count of features from plan_features
      const [planFeaturesRows] = await pool.query(
        `SELECT COUNT(*) as featureCount FROM plan_features 
         WHERE planId = ? AND isIncluded = 1`,
        [plan.id]
      );
      
      const featureCount = (planFeaturesRows as any[])[0]?.featureCount || 0;
      
      // Parse features JSON if it exists
      let featuresObject: FeaturesObject = {};
      try {
        if (plan.features) {
          featuresObject = typeof plan.features === 'string' 
            ? JSON.parse(plan.features)
            : plan.features;
        }
      } catch (error) {
        console.error('Error parsing features JSON:', error);
      }

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: parseFloat(plan.price),
        billingCycle: plan.billingCycle,
        isActive: Boolean(plan.isActive),
        features: featuresObject || {},
        featureCount: featureCount,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      };
    }));

    return NextResponse.json({ data: formattedPlans });
    
  } catch (error) {
    console.error('Error fetching public subscription plans:', error);
    return NextResponse.json(
      { message: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
} 