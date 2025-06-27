
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Branding */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-amber-900 mb-2">Chowkashi</h1>
            <p className="text-xl text-amber-700 font-medium">ask, find, bargain</p>
          </div>

          {/* Auth Buttons */}
          <Card className="shadow-lg border-amber-200">
            <CardContent className="p-6 space-y-4">
              <Link to="/login" className="block">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg">
                  Login
                </Button>
              </Link>
              
              <Link to="/signup" className="block">
                <Button variant="outline" className="w-full border-amber-600 text-amber-600 hover:bg-amber-50 py-3 text-lg">
                  Sign Up
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-sm text-gray-600 space-x-4">
        <Link to="/terms-conditions" className="hover:text-amber-600 underline">
          Terms & Conditions
        </Link>
        <span>•</span>
        <Link to="/privacy-policy" className="hover:text-amber-600 underline">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
};

export default Welcome;
