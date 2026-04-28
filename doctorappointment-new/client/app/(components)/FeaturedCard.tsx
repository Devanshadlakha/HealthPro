import React from "react";

interface FeaturesCardProps {
  title: string;
  description: string;
  icon: string;
}

const FeaturesCard: React.FC<FeaturesCardProps> = ({ title, description, icon }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  );
};

export default FeaturesCard;
