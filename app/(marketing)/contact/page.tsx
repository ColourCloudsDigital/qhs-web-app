'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitError(false);

    try {
      // This would be replaced with an actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitMessage('Thank you for your message. We will get back to you soon!');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      setSubmitError(true);
      setSubmitMessage('There was an error sending your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Contact Us</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-700 dark:text-gray-300">
          Have questions or need assistance? Our team is here to help. Reach out to us through any of the channels below.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-5">
        {/* Contact Information */}
        <div className="md:col-span-2">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Get In Touch</h2>
          
          <div className="mb-8 space-y-4">
            <div className="flex items-start">
              <MapPin className="mr-3 h-6 w-6 flex-shrink-0 text-primary" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Visit Us</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  123 Victoria Island Boulevard<br />
                  Lagos, Nigeria
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Phone className="mr-3 h-6 w-6 flex-shrink-0 text-primary" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Call Us</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  +234 123 456 7890<br />
                  Mon-Fri, 9am-5pm WAT
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Mail className="mr-3 h-6 w-6 flex-shrink-0 text-primary" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Email Us</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  info@qarashotels.com<br />
                  support@qarashotels.com
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Business Hours</h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex justify-between">
                <span>Monday - Friday:</span>
                <span>9:00 AM - 5:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday:</span>
                <span>10:00 AM - 2:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday:</span>
                <span>Closed</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800 md:col-span-3">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Send Us a Message</h2>
          
          {submitMessage && (
            <div className={`mb-6 rounded-md p-4 ${submitError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {submitMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="subject" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Map Section */}
      <div className="mt-16 overflow-hidden rounded-lg shadow-lg">
        <div className="aspect-w-16 aspect-h-9 h-96 w-full">
          {/* In a real application, replace with an actual map integration */}
          <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
            <p className="text-lg text-gray-600 dark:text-gray-300">Interactive Map would be displayed here</p>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              question: 'How do I become a hotel vendor on Qaras?',
              answer: 'To become a vendor, register an account and select the "Vendor" option. You\'ll be guided through the process of setting up your hotel profile and selecting a subscription plan.'
            },
            {
              question: 'What payment methods do you accept?',
              answer: 'We accept various payment methods including credit/debit cards, bank transfers, and mobile money services depending on your location.'
            },
            {
              question: 'How long does it take to get a response?',
              answer: 'Our support team typically responds to all inquiries within 24 hours during business days.'
            },
            {
              question: 'Do you offer custom hotel solutions?',
              answer: 'Yes, we provide custom solutions for large hotel chains or unique hotel requirements. Please contact our sales team to discuss your specific needs.'
            }
          ].map((faq, index) => (
            <div key={index} className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
              <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}