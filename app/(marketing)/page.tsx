"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Shield,
  Phone,
  CheckCircle2,
  Users,
  Building2,
  Award,
  ArrowRight,
  X,
  Star,
  Medal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const stats = [
  { label: "Years of Experience", value: "20+", icon: Award },
  { label: "Security Personnel", value: "500+", icon: Users },
  { label: "Active Clients", value: "100+", icon: Building2 },
  { label: "Branches Nationwide", value: "9", icon: Shield },
];

const services = [
  {
    title: "Body Guards",
    description:
      "Professional armed and unarmed security personnel for personal protection.",
  },
  {
    title: "Lady Checkers",
    description:
      "Female security staff for women-friendly screening at events and venues.",
  },
  {
    title: "Walk Through Gates",
    description:
      "Advanced detection technology for high-traffic security screening.",
  },
  {
    title: "Metal Detectors",
    description:
      "Handheld and stationary detectors for precise threat detection.",
  },
  {
    title: "Bullet Proof Vests",
    description:
      "High-quality protective gear for security personnel in high-risk environments.",
  },
  {
    title: "Security Systems",
    description:
      "Automated monitoring and access control for comprehensive protection.",
  },
];

const clients = [
  "Khaadi",
  "Nishat Linen",
  "Borjan",
  "KIA",
  "Limelight",
  "Outfitters",
  "MTJ - Tariq Jamil",
  "Junaid Jamshed",
  "KFC",
  "McDonald's",
  "Nestlé",
  "Imtiaz",
];

export default function HomePage() {
  const [showCommando, setShowCommando] = useState(false);

  return (
    <div>
      {/* Hero Section with Commando Avatar */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary to-primary-800 text-white overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="container relative px-4 py-12 sm:py-16 md:py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-2xl animate-fade-in-up text-center lg:text-left">
              <div className="inline-flex items-center rounded-full bg-secondary/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-secondary mb-4 sm:mb-6 shadow-lg animate-pulse-slow">
                <Shield className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Since 2004 - Trusted Security Partner
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight">
                Sheriff Security
                <span className="block text-secondary mt-2 animate-gradient bg-gradient-to-r from-secondary via-yellow-300 to-secondary bg-clip-text text-transparent">
                  The Name of Conservation
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl leading-relaxed">
                Professional security services trusted by leading brands across
                Pakistan. From bodyguards to advanced security systems, we provide
                comprehensive protection for your business and events.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:scale-105 transition-transform shadow-xl text-sm sm:text-base"
                  >
                    Get a Quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="tel:03018689990" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-red-700 text-white border-2 border-red-600 hover:bg-red-800 hover:border-red-700 transition-all shadow-xl text-sm sm:text-base font-semibold"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    03018689990
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Side - Elite Commando Avatar */}
            <div className="flex justify-center lg:justify-end mt-8 lg:mt-0">
              <div className="relative group cursor-pointer" onClick={() => setShowCommando(true)}>
                {/* Glowing Ring Animation */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-secondary via-yellow-300 to-secondary opacity-75 blur-xl sm:blur-2xl group-hover:opacity-100 transition-opacity duration-500 animate-pulse-slow" />
                
                {/* Avatar Container */}
                <div className="relative">
                  {/* Rotating Border */}
                  <div className="absolute -inset-2 sm:-inset-4 rounded-full bg-gradient-to-r from-secondary via-yellow-300 to-secondary opacity-75 blur-sm sm:blur-md group-hover:opacity-100 group-hover:blur-xl transition-all duration-500 animate-spin-slow" />
                  
                  {/* Main Avatar */}
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden border-4 sm:border-6 md:border-8 border-white shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-900" />
                    <Shield className="absolute inset-0 m-auto w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 text-white/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center animate-float px-4">
                        <Shield className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 text-secondary mx-auto mb-2 sm:mb-4 drop-shadow-2xl" />
                        <p className="text-white font-bold text-xl sm:text-2xl md:text-3xl drop-shadow-lg">Elite Security</p>
                        <p className="text-secondary text-xs sm:text-sm md:text-base font-medium">Click to Meet Our Team</p>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-secondary text-primary px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-bold text-xs sm:text-sm shadow-lg animate-bounce-slow flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    Expert
                  </div>
                  <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 bg-white text-primary px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-bold text-xs sm:text-sm shadow-lg flex items-center gap-1">
                    <Medal className="w-3 h-3 sm:w-4 sm:h-4" />
                    Certified
                  </div>
                </div>

                {/* Click Indicator - Hidden on mobile */}
                <div className="hidden sm:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-16 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full whitespace-nowrap">
                    Click to view our elite commando
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements - Hidden on mobile */}
        <div className="hidden md:block absolute top-20 left-10 opacity-20">
          <Shield className="w-12 h-12 lg:w-16 lg:h-16 text-secondary animate-float" />
        </div>
        <div className="hidden md:block absolute bottom-20 right-10 opacity-20">
          <Shield className="w-16 h-16 lg:w-20 lg:h-20 text-secondary animate-float-delayed" />
        </div>
      </section>

      {/* Commando Modal */}
      <Dialog open={showCommando} onOpenChange={setShowCommando}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden bg-gradient-to-br from-primary-50 to-white max-h-[90vh] overflow-y-auto">
          <div className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23228822' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <DialogHeader className="relative p-4 sm:p-6 pb-3 sm:pb-4 border-b border-primary/10">
              <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-secondary to-yellow-400 shadow-lg">
                  <Medal className="w-5 h-5 sm:w-7 sm:h-7 text-primary flex-shrink-0" />
                </div>
                <span className="leading-tight bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">Elite Security Commando</span>
              </DialogTitle>
              <p className="text-sm sm:text-base text-gray-600 mt-2 sm:mt-3 font-medium">Professional, Trained, and Battle-Ready</p>
            </DialogHeader>

            <div className="relative p-4 sm:p-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Commando Image */}
                <div className="relative group">
                  <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-secondary via-yellow-300 to-secondary rounded-2xl opacity-75 group-hover:opacity-100 blur-sm transition-opacity" />
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white">
                    <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] bg-white p-4">
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="relative w-full h-full">
                          <Image
                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23f8f9fa'/%3E%3Cg transform='translate(200,250)'%3E%3Ccircle r='80' fill='%23921a1d' opacity='0.1'/%3E%3Cpath d='M-30,-60 L-30,-20 L-40,-10 L-40,40 L-20,60 L20,60 L40,40 L40,-10 L30,-20 L30,-60 Z' fill='%23921a1d'/%3E%3Crect x='-35' y='-65' width='70' height='15' rx='3' fill='%23FFD700'/%3E%3Ctext x='0' y='100' text-anchor='middle' font-size='16' font-weight='bold' fill='%23921a1d' font-family='Arial'%3EELITE GUARD%3C/text%3E%3C/g%3E%3C/svg%3E"
                            alt="Elite Security Commando"
                            fill
                            className="object-contain"
                            priority
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 sm:top-2 sm:right-2 bg-gradient-to-r from-secondary to-yellow-400 text-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-1.5 border-2 border-white">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    Elite Grade
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent mb-2 sm:mb-3">Our Elite Force</h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
                      Our commandos undergo rigorous training and certification programs to ensure the highest standards of security and protection. Each member is carefully selected and trained in advanced security protocols.
                    </p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-transparent hover:from-secondary/10 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-secondary to-yellow-400 flex items-center justify-center flex-shrink-0 shadow-md">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary text-sm sm:text-base mb-1">Professional Training</h4>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Certified and extensively trained in security operations</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-transparent hover:from-secondary/10 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-secondary to-yellow-400 flex items-center justify-center flex-shrink-0 shadow-md">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary text-sm sm:text-base mb-1">24/7 Protection</h4>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Round-the-clock security services for complete peace of mind</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-transparent hover:from-secondary/10 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-secondary to-yellow-400 flex items-center justify-center flex-shrink-0 shadow-md">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary text-sm sm:text-base mb-1">Battle-Tested Experience</h4>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Years of experience protecting high-profile clients and assets</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-4">
                    <Link href="/contact">
                      <Button className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-xl hover:shadow-2xl transition-all text-sm sm:text-base font-bold" size="lg">
                        <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Request Elite Security Team</span>
                        <span className="sm:hidden">Request Security Team</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Section */}
      <section className="py-10 sm:py-12 md:py-16 bg-gradient-to-b from-gray-50 to-white border-b relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="container relative px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center group hover:scale-105 sm:hover:scale-110 transition-transform duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-2 sm:mb-3 md:mb-4 inline-flex p-2 sm:p-3 md:p-4 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 sm:mb-2 animate-fade-in">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium px-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28 relative">
        <div className="container px-4">
          <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-3 sm:mb-4 text-secondary">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Our Services</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent px-4">
              Comprehensive Security Solutions
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Tailored to your unique needs with skilled professionals ready around-the-clock to protect what matters most to you.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {services.map((service, index) => (
              <Card
                key={service.title}
                className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 group border-2 border-gray-200 hover:border-secondary/60 bg-gradient-to-br from-white to-gray-50 relative overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-4 sm:p-6 relative">
                  <div className="mb-3 sm:mb-4 inline-flex p-2 sm:p-3 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 group-hover:from-secondary/20 group-hover:to-yellow-400/20 transition-all shadow-sm group-hover:shadow-md">
                    <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-accent group-hover:text-secondary transition-colors" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-primary-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                    {service.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8 sm:mt-12">
            <Link href="/services">
              <Button variant="outline" size="lg" className="group hover:bg-primary hover:text-white transition-all text-sm sm:text-base">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Shield className="hidden md:block absolute top-10 left-10 w-48 h-48 lg:w-64 lg:h-64 text-primary animate-spin-very-slow" />
          <Shield className="hidden md:block absolute bottom-10 right-10 w-36 h-36 lg:w-48 lg:h-48 text-secondary animate-spin-very-slow" />
        </div>
        <div className="container relative px-4">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 mb-3 sm:mb-4 text-secondary">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Our Clients</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-4">
              Trusted By Leading Brands
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              We are proud to provide security services to some of Pakistan&apos;s
              most renowned companies and organizations.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {clients.map((client, index) => (
              <div
                key={client}
                className="bg-gradient-to-br from-white to-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 text-center shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-200 hover:border-secondary/50 group relative overflow-hidden"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center h-12 sm:h-14 mb-2">
                  <div className="w-full h-full flex items-center justify-center">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary/20 group-hover:text-secondary/30 transition-colors" />
                  </div>
                </div>
                <span className="relative text-xs sm:text-sm md:text-base font-bold text-gray-800 group-hover:text-primary transition-colors">{client}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-br from-primary via-primary-600 to-primary-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="container text-center relative px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Ready to Secure Your Business?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 sm:mb-10 leading-relaxed">
              Contact us today for a free consultation. Our security experts will
              assess your needs and provide a customized solution tailored to your specific requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/contact" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:scale-105 transition-all shadow-2xl text-sm sm:text-base md:text-lg px-6 sm:px-8"
                >
                  Contact Us
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <a href="tel:03018689990" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-red-700 text-white border-2 border-red-600 hover:bg-red-800 hover:border-red-700 transition-all shadow-2xl text-sm sm:text-base md:text-lg px-6 sm:px-8 font-bold"
                >
                  <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Call Now
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="hidden md:block absolute top-10 left-10 opacity-20">
          <Shield className="w-16 h-16 lg:w-24 lg:h-24 text-secondary animate-float" />
        </div>
        <div className="hidden md:block absolute bottom-10 right-10 opacity-20">
          <Shield className="w-20 h-20 lg:w-32 lg:h-32 text-secondary animate-float-delayed" />
        </div>
      </section>
    </div>
  );
}
