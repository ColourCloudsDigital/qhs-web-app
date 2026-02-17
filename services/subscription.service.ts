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
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
      },
      include: {
        planFeatures: {
          include: {
            module: true,
          },
        },
      },
      orderBy: {
        price: 'asc',
      },
    });

    // Transform the subscription plans data
    const transformedPlans = plans.map((plan: any) => {
      const features = plan.planFeatures.map((feature: any) => {
        const limits = JSON.parse(feature.limits as string);
        return {
          moduleId: feature.moduleId,
          moduleName: feature.module.name,
          moduleType: feature.module.type,
          moduleDescription: feature.module.description,
          isIncluded: feature.isIncluded,
          limits,
        };
      });

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        billingCycle: plan.billingCycle,
        isActive: plan.isActive,
        features: features,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      };
    });

    return transformedPlans;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
}

export async function getModules(): Promise<Module[]> {
  try {
    const modules = await prisma.module.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return modules;
  } catch (error) {
    console.error('Error fetching modules:', error);
    return [];
  }
}