"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/branches", label: "Branches" },
  { href: "/contact", label: "Contact" },
];

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Logo size={40} />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary leading-tight">
              Sheriff Security
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              The Name of Conservation
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:space-x-4">
          <Link href="/login">
            <Button variant="outline" className="flex text-xs px-3 h-9 sm:text-sm sm:px-4 sm:h-10">
              Login
            </Button>
          </Link>
          <a href="tel:03018689990" className="hidden sm:inline-flex">
            <Button className="bg-primary hover:bg-primary-700 h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2">
              <Phone className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Call Now</span>
            </Button>
          </a>
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white animate-fade-in">
          <nav className="container py-4 flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-foreground hover:text-primary hover:bg-gray-50 transition-colors px-3 py-2.5 rounded-md"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="tel:03018689990"
              className="flex items-center gap-2 text-sm font-medium text-primary px-3 py-2.5"
            >
              <Phone className="h-4 w-4" />
              03018689990
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Logo size={32} />
              <div>
                <h3 className="font-bold text-white">Sheriff Security</h3>
                <p className="text-xs text-gray-400">Since 2004</p>
              </div>
            </div>
            <p className="text-sm">
              &quot;The Name of Conservation&quot; - Professional security services
              trusted by leading brands across Pakistan.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-secondary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-secondary transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/projects"
                  className="hover:text-secondary transition-colors"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/branches"
                  className="hover:text-secondary transition-colors"
                >
                  Branches
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-secondary transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4">Our Services</h4>
            <ul className="space-y-2 text-sm">
              <li>Body Guards</li>
              <li>Lady Checkers</li>
              <li>Walk Through Gates</li>
              <li>Metal Detectors</li>
              <li>Bullet Proof Vests</li>
              <li>Security Systems</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Head Office</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-secondary" />
                <span>
                  Mohalla Nawaban Main Street Jalwana Chock, Bahawalpur, 63100
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-secondary" />
                <span>03018689990, 03336644631</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-secondary" />
                <span>sheriffsgssc@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} Sheriff Security Company Pvt. Ltd.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
