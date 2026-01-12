import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      <span className="ml-2 text-gray-600">Processing...</span>
    </div>
  );
};

export default Loading;