import React from "react";
import Link from "next/link";
const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          {/* Inline SVG for the HealthX logo */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 50"
            className="h-10 w-auto mr-2"
            fill="none"
            role="img"
            aria-label="HealthX Logo"
          >
            {/* Speed Lines */}
            <g fill="#0084ff">
              <rect x="5" y="15" width="30" height="4" rx="2"></rect>
              <rect x="10" y="25" width="50" height="4" rx="2"></rect>
              <rect x="5" y="35" width="40" height="4" rx="2"></rect>
            </g>

            {/* Medical Cross */}
            <g transform="translate(60, 12)">
              <rect x="10" y="0" width="10" height="30" rx="2" fill="#0084ff"></rect>
              <rect x="0" y="10" width="30" height="10" rx="2" fill="#0084ff"></rect>
            </g>

            {/* HealthX Text */}
            <text
              x="100"
              y="35"
              font-family="Arial, sans-serif"
              font-size="24"
              font-weight="bold"
              fill="#333"
            >
              HealthX
            </text>
          </svg>
        </div>
        <div>
          <Link href="/auth/features" className="text-gray-700 hover:text-blue-600 mx-4">
            Features
          </Link>
<Link href="/auth/contact" className="text-gray-700 hover:text-blue-600 mx-4">
            Contact
          </Link>
          <Link href="/" className="text-gray-700 hover:text-blue-600 mx-4">
            Home
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
