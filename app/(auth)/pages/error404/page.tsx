import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
    title: 'Error 404',
};

const Error404 = () => {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            <div className="px-6 py-16 text-center font-semibold md:py-20">
                <div className="relative">
                    <img src="/assets/icons/404.png" 
                        alt="404" 
                        className="dark-img mx-auto -mt-20 w-full max-w-10 object-cover md:-mt-14 md:max-w-32" />
                    <img src="/assets/icons/404.png" 
                         alt="404" 
                         className="light-img mx-auto -mt-20 w-full max-w-10 object-cover md:-mt-14 md:max-w-32" />
                    <p className="mt-5 text-base dark:text-white">The page you requested was not found!</p>
                    <Link href="/" className="btn btn-primary mx-auto !mt-7 w-max border-0 uppercase shadow-none">
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Error404;
