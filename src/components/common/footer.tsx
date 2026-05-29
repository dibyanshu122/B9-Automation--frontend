import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Logo } from '@/components/logo';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Logo variant="light" />
            </div>
            <p className="text-gray-600 text-sm">
              Creating intelligent AI assistants from documents
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/pricing" className="text-gray-600 hover:text-primary-500">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-primary-500">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-primary-500">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-600 hover:text-primary-500">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-primary-500">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-primary-500">
                  Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Follow</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-gray-600 hover:text-primary-500 transition"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-primary-500 transition"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-primary-500 transition"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:support@brainai.in"
                className="text-gray-600 hover:text-primary-500 transition"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            (c) {currentYear} B9 Automation. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm">
              Privacy
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm">
              Terms
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};


