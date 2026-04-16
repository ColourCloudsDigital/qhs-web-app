import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicMenuView from '@/components/menus/PublicMenuView';

type Props = {
  params: {
    id: string;
  };
};

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Fetch menu data
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/menus/${params.id}`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });
    
    if (!res.ok) {
      return {
        title: 'Menu - Qaras Hospitality Solutions',
        description: 'View hotel menu'
      };
    }
    
    const data = await res.json();
    const hotelName = data.hotel?.name || 'Restaurant';
    
    return {
      title: `Menu for ${hotelName} - Qaras Hospitality Solutions`,
      description: `View the menu for ${hotelName}`,
    };
  } catch (error) {
    return {
      title: 'Menu - Qaras Hospitality Solutions',
      description: 'View hotel menu'
    };
  }
}

// Menu page component
export default async function MenuPage({ params }: Props) {
  try {
    // Fetch menu data
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/menus/${params.id}`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });
    
    if (!res.ok) {
      return notFound();
    }
    
    const menuData = await res.json();
    
    if (!menuData.categories || menuData.categories.length === 0) {
      return notFound();
    }
    
    return <PublicMenuView menuData={menuData} hotelId={params.id} />;
  } catch (error) {
    console.error('Error loading menu:', error);
    return notFound();
  }
} 