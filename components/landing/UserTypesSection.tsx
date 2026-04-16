'use client';

import Image from 'next/image'; // Import Next.js Image component

export default function UserTypesSection() {
  const userTypes = [
    {
      name: 'Managers',
      iconSrc: '/assets/icons/managers.png',
      bgColor: 'bg-slate-100 dark:bg-indigo-900',
      textColor: 'text-indigo-600 dark:text-indigo-300',
      features: [
        'Facility platform control',
        'Create service packages',
        'Configure payment flows',
        'Access platform analytics',
        'Manage global content',
      ],
    },
    {
      name: 'Vendors',
      iconSrc: '/assets/icons/vendors.png',
      bgColor: 'bg-slate-100 dark:bg-purple-900',
      textColor: 'text-purple-600 dark:text-purple-300',
      features: [
        'Hotel profile management',
        'Staff account creation',
        'Module access based on plan',
        'Hotel content management',
        'Financial reporting',
      ],
    },
    {
      name: 'Staff',
      iconSrc: '/assets/icons/staff.png',
      bgColor: 'bg-slate-100 dark:bg-blue-900',
      textColor: 'text-blue-600 dark:text-blue-300',
      features: [
        'Manage assigned tasks',
        'Process guest requests',
        'Update room statuses',
        'Coordinate with management',
        'View work schedules',
      ],
    },
  ];

  return (
    <section className="bg-gray-100 py-16 dark:bg-gray-800">
      <div className="container mx-auto max-w-6xl px-4">
        <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Designed for Everyone in the Hotel Management Team
        </h2>
        <p className="mb-12 text-center text-lg text-gray-600 dark:text-gray-400">
          Qaras Hospitality Solutions serves the needs of hotel owners, managers, and staff
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          {userTypes.map((userType) => (
            <div key={userType.name} className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-700">
              <div className="mb-6 flex justify-left">
                <Image
                  src={userType.iconSrc}
                  alt={`${userType.name} icon`}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">{userType.name}</h3>
              <ul className="mb-4 space-y-2 text-gray-600 dark:text-gray-300">
                {userType.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
