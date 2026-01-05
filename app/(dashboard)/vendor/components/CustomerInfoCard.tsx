'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock,
  Edit
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CustomerInfoCardProps {
  customer: any;
}

export default function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Determine what name to display in order of preference
  const customerName = () => {
    if (customer?.firstName && customer?.lastName) {
      return `${customer.firstName} ${customer.lastName}`;
    } else if (customer?.firstName) {
      return customer.firstName;
    } else if (customer?.lastName) {
      return customer.lastName;
    } else if (customer?.name) {
      return customer.name;
    }
    return 'Guest';
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      } 
    }
  };
  
  return (
    <motion.div 
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex items-center justify-between">
        <motion.div variants={itemVariants} className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {customerName()}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {customer?.userId ? 'Registered Customer' : 'Guest Customer'}
            </p>
          </div>
        </motion.div>
        
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer Information</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500">
                Contact the system administrator to edit customer details.
              </p>
            </div>
          </DialogContent>
        </Dialog>
          </div>
          
      <motion.div 
        className="mt-6 grid gap-4 md:grid-cols-2"
        variants={containerVariants}
      >
        {customer?.phone && (
          <motion.div variants={itemVariants} className="flex items-start">
            <div className="mr-3 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Phone className="h-4 w-4" />
              </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{customer.phone}</p>
            </div>
          </motion.div>
          )}
          
        {customer?.email && (
          <motion.div variants={itemVariants} className="flex items-start">
            <div className="mr-3 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
              <Mail className="h-4 w-4" />
              </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{customer.email}</p>
            </div>
          </motion.div>
          )}
        
        {customer?.address && (
          <motion.div variants={itemVariants} className="flex items-start">
            <div className="mr-3 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <MapPin className="h-4 w-4" />
        </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{customer.address}</p>
      </div>
          </motion.div>
        )}
        
        {customer?.createdAt && (
          <motion.div variants={itemVariants} className="flex items-start">
            <div className="mr-3 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Since</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                {formatDate(customer.createdAt)}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {customer?.notes && (
        <motion.div 
          variants={itemVariants}
          className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
        >
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Notes</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{customer.notes}</p>
        </motion.div>
      )}
    </motion.div>
  );
}