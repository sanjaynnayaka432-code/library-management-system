import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookX, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-6">
        <Logo size="large" showSubtitle={false} />
      </div>

      <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-brand-600 mb-6 shadow-sm">
        <BookX className="w-10 h-10" />
      </div>

      <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
        404 - Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2 mb-8 leading-relaxed">
        The catalog section, archive record, or administrative route you're looking for does not exist or has been relocated.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button variant="primary" icon={Home} onClick={() => navigate('/')}>
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
