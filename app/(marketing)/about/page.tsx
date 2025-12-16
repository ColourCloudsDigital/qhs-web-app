import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Qaras Hotels',
  description: 'Learn more about Qaras Hotels - the premier hotel booking and management platform in Africa.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">About Qaras Hotels</h1>
        <p className="mx-auto max-w-3xl text-lg text-gray-700 dark:text-gray-300">
          We&apos;re transforming the way hotels operate and how travelers experience them
        </p>
      </div>

      {/* Our Story */}
      <div className="mb-16 grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Our Story</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Qaras Hotels began with a simple observation: the hotel industry in Africa needed better tools to manage properties efficiently and connect with travelers. Our founders, who had worked in hospitality for years, saw a gap in the market for a comprehensive, all-in-one solution.
          </p>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Founded in 2022, Qaras Hotels has quickly grown from a startup with a vision to a trusted platform serving thousands of hotels and travelers. We&apos;re focused on empowering hotel owners with technology that would otherwise be out of reach, while giving travelers seamless booking experiences.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Today, we&apos;re proud to be a leading hotel management system in the region, constantly innovating and expanding our offerings to meet the evolving needs of the hospitality industry.
          </p>
        </div>
        <div className="relative h-[400px] overflow-hidden rounded-lg shadow-lg">
          <Image
            src="/assets/images/about-img.png"
            alt="Qaras Hotels story"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Our Mission */}
      <div className="mb-16 bg-primary/5 p-12 rounded-lg">
        <div className="text-center">
          <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-700 dark:text-gray-300">
            &quot;To empower hotels of all sizes with affordable, enterprise-grade technology, while connecting travelers with the perfect accommodations for their needs.&quot;
          </p>
        </div>
      </div>

      {/* Our Team */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">Meet Our Leadership</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              name: 'Alfonzo Osunde',
              role: 'Managing Director',
              bio: 'Auditing consultant with over 15 years experience working with service businesses across Africa.',
              image: '/assets/images/about/team-1.jpg'
            },
            {
              name: 'Philomena Fadipe',
              role: 'Corporate Services Manager',
              bio: 'Admin Management profesional, focusing on solutions for emerging markets.',
              image: '/assets/images/about/team-2.jpg'
            },
            {
              name: 'Sokari Andrew-Jaja',
              role: 'CTO',
              bio: 'Full-Stack Developer with cross-functional experience in the tech industry.',
              image: '/assets/images/about/team-3.jpg'
            }
          ].map((member, index) => (
            <div key={index} className="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-800">
              <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">{member.name}</h3>
              <p className="mb-3 text-primary">{member.role}</p>
              <p className="text-gray-700 dark:text-gray-300">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-16 grid gap-6 rounded-lg bg-gray-100 p-8 dark:bg-gray-800 md:grid-cols-4">
        {[
          { value: '200+', label: 'Hotels' },
          { value: '15,000+', label: 'Rooms Managed' },
          { value: '100,000+', label: 'Bookings' },
          { value: '5', label: 'Countries' }
        ].map((stat, index) => (
          <div key={index} className="text-center">
            <p className="text-4xl font-bold text-primary">{stat.value}</p>
            <p className="text-gray-700 dark:text-gray-300">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">Our Values</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Innovation',
              description: 'We continuously develop new features and solutions to keep our hotels ahead of the curve.'
            },
            {
              title: 'Accessibility',
              description: 'We make enterprise technology accessible to hotels of all sizes through affordable pricing models.'
            },
            {
              title: 'Local Focus',
              description: 'We understand the unique challenges of operating hotels in African markets and build solutions specifically for these needs.'
            },
            {
              title: 'Customer Success',
              description: 'We measure our success by the success of our hotel partners and the satisfaction of their guests.'
            },
            {
              title: 'Quality',
              description: 'We maintain the highest standards in all aspects of our platform, from code to customer support.'
            },
            {
              title: 'Community',
              description: 'We foster a community of hotel operators who can learn from and support each other.'
            }
          ].map((value, index) => (
            <div key={index} className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{value.title}</h3>
              <p className="text-gray-700 dark:text-gray-300">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}