'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, onClick }: CardProps) {
  const Component = hover ? motion.div : 'div';
  
  const hoverProps = hover
    ? {
        whileHover: { y: -6, scale: 1.01 },
        whileTap: { scale: 0.99 },
        transition: { duration: 0.2 },
      }
    : {};

  return (
    <Component
      className={clsx(
        'bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden transition-shadow duration-300',
        hover && 'cursor-pointer hover:shadow-card-hover',
        className
      )}
      onClick={onClick}
      {...hoverProps}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('px-6 py-4 border-b border-slate-100', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('px-6 py-4 bg-slate-50/80 border-t border-slate-100', className)}>
      {children}
    </div>
  );
}
