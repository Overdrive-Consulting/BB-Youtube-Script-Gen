
import React from 'react';
import { UserMenu } from './UserMenu';

export const CustomHeader: React.FC = () => {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="ml-auto flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </div>
  );
};
