import pool from '@/lib/db';

// Define TypeScript interfaces for our data
interface ModuleLimit {
  [key: string]: string | number;
}

interface PlanFeature {
  moduleId: string;
  moduleName: string;
  moduleType: string;
  moduleDescription: string;
  isIncluded: boolean;
  limits: ModuleLimit;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  isActive: boolean;
  features: PlanFeature[];
  createdAt: Date;
  updatedAt: Date;
}

interface Module {
  id: string;
  type: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    // Get subscription plans with their features and modules
    const [planRows] = await pool.query(`
      SELECT 
        sp.id,
        sp.name,
        sp.description,
        sp.price,
        sp.billingCycle,
        sp.isActive,
        sp.createdAt,
        sp.updatedAt,
        pf.moduleId,
        pf.isIncluded,
        pf.limits,
        m.name as moduleName,
        m.type as moduleType,
        m.description as moduleDescription
      FROM subscription_plans sp
      LEFT JOIN plan_features pf ON sp.id = pf.planId
      LEFT JOIN modules m ON pf.moduleId = m.id
      WHERE sp.isActive = 1
      ORDER BY sp.price ASC, m.name ASC
    `);

    const plans = planRows as any[];
    
    // Group features by plan
    const planMap = new Map<string, SubscriptionPlan>();
    
    plans.forEach((row) => {
      if (!planMap.has(row.id)) {
        planMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          price: parseFloat(row.price),
          billingCycle: row.billingCycle,
          isActive: Boolean(row.isActive),
          features: [],
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        });
      }
      
      // Add feature if it exists
      if (row.moduleId) {
        const plan = planMap.get(row.id)!;
        const limits = row.limits ? JSON.parse(row.limits) : {};
        
        plan.features.push({
          moduleId: row.moduleId,
          moduleName: row.moduleName,
          moduleType: row.moduleType,
          moduleDescription: row.moduleDescription,
          isIncluded: Boolean(row.isIncluded),
          limits,
        });
      }
    });

    return Array.from(planMap.values());
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
}

export async function getModules(): Promise<Module[]> {
  try {
    const [rows] = await pool.query(`
      SELECT id, type, name, description, isActive, createdAt, updatedAt
      FROM modules
      WHERE isActive = 1
      ORDER BY name ASC
    `);

    const modules = (rows as any[]).map((row) => ({
      id: row.id,
      type: row.type,
      name: row.name,
      description: row.description,
      isActive: Boolean(row.isActive),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));

    return modules;
  } catch (error) {
    console.error('Error fetching modules:', error);
    return [];
  }
}