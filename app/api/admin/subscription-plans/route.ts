import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Define types for MySQL query results
type QueryResult = any[];
type MySQLRow = Record<string, any>;

// Interface for module limits
interface ModuleLimit {
  [key: string]: string | number;
}

// Interface for features object
interface FeaturesObject {
  [key: string]: boolean | string | number;
}

// Interface for subscription plans
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  isActive: boolean;
  features: FeaturesObject;
  createdAt: Date;
  updatedAt: Date;
}

// GET handler to fetch subscription plans with pagination, sorting, and filtering
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const listAll = searchParams.get('listAll') === 'true';
    const simple = searchParams.get('simple') === 'true';
    
    // Only require authentication for admin operations, not for public listing
    if (!listAll && !simple) {
      const session = await getServerSession(authOptions);
      console.log("Subscription Plans API - Session:", session?.user);
      
      // Accept SUPER_ADMIN role as well
      if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        console.log("Subscription Plans API - Unauthorized - Role:", session?.user?.role);
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
    }

    // If we just need a simple list of plans for dropdowns
    if (simple) {
      try {
        const [plans] = await pool.query(`
          SELECT id, name, price 
          FROM subscription_plans 
          WHERE isActive = TRUE 
          ORDER BY price ASC
        `);
        
        return NextResponse.json({ plans });
      } catch (error) {
        console.error('Error fetching simple plans list:', error);
        return NextResponse.json({ plans: [] });
      }
    }

    // Get query parameters for pagination and sorting
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('pageSize') || '10'); // Changed limit to pageSize
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortColumn') || 'createdAt'; // Changed sortBy to sortColumn
    const sortOrder = searchParams.get('sortDirection') || 'desc'; // Changed sortOrder to sortDirection

    // If we just need a simple list of active plans, return them directly
    if (listAll) {
      try {
        const [plans] = await pool.query(`
          SELECT * FROM subscription_plans 
          WHERE isActive = TRUE 
          ORDER BY price ASC
        `) as [MySQLRow[], any];

        // Process each plan to parse the features JSON
        const formattedPlans = await Promise.all(plans.map(async (plan: MySQLRow) => {
          // Get count of features from plan_features
          const [planFeaturesRows] = await pool.query(
            `SELECT COUNT(*) as featureCount FROM plan_features 
             WHERE planId = ? AND isIncluded = 1`,
            [plan.id]
          ) as [MySQLRow[], any];
          
          const featureCount = planFeaturesRows[0]?.featureCount || 0;
          
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
        console.error('Error fetching plans:', error);
        return NextResponse.json({ data: [] });
      }
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    try {
      // Construct the WHERE clause for search
      let whereClause = '';
      let whereParams: any[] = [];
      if (search) {
        whereClause = `WHERE name LIKE ? OR description LIKE ?`;
        whereParams = [`%${search}%`, `%${search}%`];
      }

      // Query to count total plans matching the search
      const countQuery = `
        SELECT COUNT(*) as total FROM subscription_plans
        ${whereClause}
      `;
      const [countResult] = await pool.query(countQuery, whereParams) as [MySQLRow[], any];
      const total = parseInt(countResult[0].total || '0');

      // Query to get paginated plans with additional counts
      const plansQuery = `
        SELECT 
          p.*, 
          (SELECT COUNT(*) FROM vendors WHERE subscriptionPlanId = p.id) as vendorCount
        FROM subscription_plans p
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;
      const [plans] = await pool.query(
        plansQuery, 
        [...whereParams, limit, offset]
      ) as [MySQLRow[], any];

      // If no plans found, return empty
      if (plans.length === 0) {
        return NextResponse.json({
          plans: [],
          total,
          page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
        });
      }

      // Process each plan to get additional data and parse the features JSON
      const formattedPlans = await Promise.all(plans.map(async (plan: MySQLRow) => {
        // Get count of features from plan_features
        const [planFeaturesRows] = await pool.query(
          `SELECT COUNT(*) as featureCount FROM plan_features 
           WHERE planId = ? AND isIncluded = 1`,
          [plan.id]
        ) as [MySQLRow[], any];
        
        const featureCount = planFeaturesRows[0]?.featureCount || 0;
        
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
          vendorCount: parseInt(plan.vendorCount || '0'),
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        };
      }));

      // Format response to match what frontend expects
      return NextResponse.json({
        plans: formattedPlans,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return NextResponse.json(
        { message: 'Failed to fetch subscription plans' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { message: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

// POST handler to create a new subscription plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    const { name, description, price, billingCycle, isActive = true, features } = body;

    // Validate required fields
    if (!name || price === undefined || !billingCycle) {
      return NextResponse.json(
        { message: 'Name, price, and billing cycle are required' },
        { status: 400 }
      );
    }

    // Create the subscription plan using a transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Generate UUID for the plan
      const planId = uuidv4();
      
      // Stringify the features for storage
      const featuresJSON = features ? JSON.stringify(features) : '{}';

      // Create the subscription plan
      const insertPlanQuery = `
        INSERT INTO subscription_plans (id, name, description, price, billingCycle, isActive, features)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.query(
        insertPlanQuery, 
        [planId, name, description, price, billingCycle, isActive, featuresJSON]
      );

      // Insert plan_features entries if features were provided
if (features && typeof features === 'object') {
  // Get all valid modules from the database
  const [modulesRows] = await connection.query(
    `SELECT id FROM modules`
  ) as [MySQLRow[], any];
  
  const moduleIds = modulesRows.map((m: any) => m.id);
  
  // Insert features for each module if it exists
  for (const [moduleId, value] of Object.entries(features)) {
    if (!moduleIds.includes(moduleId)) {
      continue; // Skip if module doesn't exist in our database
    }

    // Handle both boolean and object (for limits) cases
    const isIncluded = typeof value === 'object' ? (value as any).included : !!value;
    const limits = typeof value === 'object' && value !== null ? (value as any).limits : null;

    const featureId = uuidv4(); // ← Generate UUID for plan_features.id

    await connection.query(
      `INSERT INTO plan_features 
       (id, planId, moduleId, isIncluded, limits)
       VALUES (?, ?, ?, ?, ?)`,
      [
        featureId,     // ← New: provide the generated UUID
        planId,
        moduleId,
        isIncluded ? 1 : 0,
        limits ? JSON.stringify(limits) : null
      ]
    );
  }
}
      
      await connection.commit();
      
      // Get the created plan with all its data
      const [planRows] = await pool.query(`
        SELECT * FROM subscription_plans WHERE id = ?
      `, [planId]) as [MySQLRow[], any];
      
      if (!planRows || planRows.length === 0) {
        return NextResponse.json(
          { message: 'Failed to retrieve created plan' },
          { status: 500 }
        );
      }
      
      const plan = planRows[0];
      
      // Get the associated plan features
      const [planFeaturesRows] = await pool.query(
        `SELECT pf.*, m.name as moduleName, m.description as moduleDescription, m.type as moduleType 
         FROM plan_features pf
         LEFT JOIN modules m ON pf.moduleId = m.id
         WHERE pf.planId = ?`,
        [planId]
      ) as [MySQLRow[], any];
      
      // Parse features from the plan
      let parsedFeatures: FeaturesObject = {};
      try {
        if (plan.features) {
          parsedFeatures = typeof plan.features === 'string' 
            ? JSON.parse(plan.features)
            : plan.features;
        }
      } catch (error) {
        console.error('Error parsing features JSON:', error);
      }

      // Return the formatted plan
      const result = {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: parseFloat(plan.price),
        billingCycle: plan.billingCycle,
        isActive: Boolean(plan.isActive),
        features: parsedFeatures || {},
        planFeatures: planFeaturesRows.map(feature => ({
          id: feature.id,
          moduleId: feature.moduleId,
          moduleName: feature.moduleName,
          moduleDescription: feature.moduleDescription,
          moduleType: feature.moduleType,
          isIncluded: Boolean(feature.isIncluded),
          limits: feature.limits ? JSON.parse(feature.limits) : {}
        })),
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      };

      return NextResponse.json(result);
    } catch (error) {
      await connection.rollback();
      console.error('Error creating subscription plan:', error);
      return NextResponse.json(
        { message: 'Failed to create subscription plan' },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { message: 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
}