import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import Image from "next/image";

const brandLogos = [
  { name: "Khaadi", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Georgia,serif' font-size='18' font-weight='bold' text-anchor='middle' fill='%234a5568'%3EKHAADI%3C/text%3E%3C/svg%3E" },
  { name: "KFC", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Crect width='100' height='40' rx='5' fill='%23e4002b'/%3E%3Ctext x='50' y='28' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='white'%3EKFC%3C/text%3E%3C/svg%3E" },
  { name: "McDonald's", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Cpath d='M20,10 Q30,5 35,20 Q40,5 50,10' fill='none' stroke='%23FFC72C' stroke-width='8' stroke-linecap='round'/%3E%3Ctext x='50' y='35' font-family='Arial' font-size='10' font-weight='bold' text-anchor='middle' fill='%23DA291C'%3EMcDonald's%3C/text%3E%3C/svg%3E" },
  { name: "Nishat Linen", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='20' font-family='Arial' font-size='12' font-weight='bold' text-anchor='middle' fill='%232d3748'%3ENishat%3C/text%3E%3Ctext x='50' y='32' font-family='Arial' font-size='10' text-anchor='middle' fill='%234a5568'%3ELinen%3C/text%3E%3C/svg%3E" },
  { name: "Junaid Jamshed", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='22' font-family='Georgia,serif' font-size='16' font-weight='bold' text-anchor='middle' fill='%23000'%3EJ.%3C/text%3E%3Ctext x='50' y='34' font-family='Arial' font-size='10' text-anchor='middle' fill='%234a5568'%3EJunaid Jamshed%3C/text%3E%3C/svg%3E" },
  { name: "Imtiaz", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Crect width='100' height='40' rx='3' fill='%2300a651'/%3E%3Ctext x='50' y='27' font-family='Arial' font-size='18' font-weight='bold' text-anchor='middle' fill='white'%3EIMTIAZ%3C/text%3E%3C/svg%3E" },
];

const megaProjects = [
  {
    title: "Cholistan Jeep Rally",
    category: "Sports Event",
    description:
      "Sheriff Security provided comprehensive security coverage for the renowned Cholistan Jeep Rally, ensuring safety across the desert terrain. Our team managed crowd control, participant security, and event perimeter protection.",
    location: "Cholistan Desert, Punjab",
    highlights: [
      "Perimeter security",
      "VIP protection",
      "Crowd management",
      "Emergency response",
    ],
  },
  {
    title: "Karachi Eat Festival",
    category: "Food Festival",
    description:
      "Comprehensive security services for Pakistan's largest food festival. Our team managed entry screening, crowd control, and overall event security for thousands of daily visitors.",
    location: "Karachi, Sindh",
    highlights: [
      "Entry screening",
      "Walk-through gates",
      "Crowd control",
      "Night security",
    ],
  },
  {
    title: "Salana Ijtimaa",
    category: "Religious Gathering",
    description:
      "Large-scale security operations for the annual religious gathering. Sheriff Security ensured smooth operations with thousands of attendees, providing 24/7 security coverage.",
    location: "Multiple Locations",
    highlights: [
      "24/7 coverage",
      "Traffic management",
      "Emergency services",
      "Volunteer coordination",
    ],
  },
  {
    title: "Tent Pegging Spring Festival",
    category: "Cultural Event",
    description:
      "Security coverage for the traditional tent pegging competitions and spring festival celebrations. Our team managed spectator safety and participant security.",
    location: "Punjab Region",
    highlights: [
      "Arena security",
      "Spectator safety",
      "Participant protection",
      "Equipment security",
    ],
  },
  {
    title: "Dushman Drama - PTV",
    category: "Entertainment",
    description:
      "On-set security for Mont Blanc Entertainment's production. Sheriff Security provided location security, equipment protection, and crowd management during outdoor shoots.",
    location: "Various Locations",
    highlights: [
      "Location security",
      "Equipment protection",
      "Crowd barriers",
      "Celebrity protection",
    ],
  },
];

const clients = [
  {
    category: "Retail & Fashion",
    names: [
      { name: "Khaadi", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Georgia,serif' font-size='18' font-weight='bold' text-anchor='middle' fill='%234a5568'%3EKHAADI%3C/text%3E%3C/svg%3E" },
      { name: "Nishat Linen", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='20' font-family='Arial' font-size='12' font-weight='bold' text-anchor='middle' fill='%232d3748'%3ENishat%3C/text%3E%3Ctext x='50' y='32' font-family='Arial' font-size='10' text-anchor='middle' fill='%234a5568'%3ELinen%3C/text%3E%3C/svg%3E" },
      { name: "Borjan", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='%23000'%3EBORJAN%3C/text%3E%3C/svg%3E" },
      { name: "Limelight", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Arial' font-size='14' font-weight='bold' text-anchor='middle' fill='%2366cc66'%3ELIMELIGHT%3C/text%3E%3C/svg%3E" },
      { name: "Outfitters", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Arial' font-size='14' font-weight='bold' text-anchor='middle' fill='%23000'%3EOUTFITTERS%3C/text%3E%3C/svg%3E" },
      { name: "MTJ - Tariq Jamil", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='22' font-family='Georgia,serif' font-size='18' font-weight='bold' text-anchor='middle' fill='%23228822'%3EMTJ%3C/text%3E%3Ctext x='50' y='35' font-family='Arial' font-size='8' text-anchor='middle' fill='%234a5568'%3ETariq Jamil%3C/text%3E%3C/svg%3E" },
      { name: "Junaid Jamshed", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='22' font-family='Georgia,serif' font-size='16' font-weight='bold' text-anchor='middle' fill='%23000'%3EJ.%3C/text%3E%3Ctext x='50' y='34' font-family='Arial' font-size='10' text-anchor='middle' fill='%234a5568'%3EJunaid Jamshed%3C/text%3E%3C/svg%3E" },
      { name: "Wasim Badami by Hemani", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='20' font-family='Arial' font-size='10' font-weight='bold' text-anchor='middle' fill='%23000'%3EWasim Badami%3C/text%3E%3Ctext x='50' y='32' font-family='Arial' font-size='8' text-anchor='middle' fill='%234a5568'%3Eby Hemani%3C/text%3E%3C/svg%3E" },
    ],
  },
  {
    category: "Food & Restaurants",
    names: [
      { name: "KFC", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Crect width='100' height='40' rx='5' fill='%23e4002b'/%3E%3Ctext x='50' y='28' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='white'%3EKFC%3C/text%3E%3C/svg%3E" },
      { name: "McDonald's", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Cpath d='M20,10 Q30,5 35,20 Q40,5 50,10' fill='none' stroke='%23FFC72C' stroke-width='8' stroke-linecap='round'/%3E%3Ctext x='50' y='35' font-family='Arial' font-size='10' font-weight='bold' text-anchor='middle' fill='%23DA291C'%3EMcDonald's%3C/text%3E%3C/svg%3E" },
      { name: "Nestlé", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Arial' font-size='18' font-weight='bold' text-anchor='middle' fill='%23000'%3ENestl%C3%A9%3C/text%3E%3C/svg%3E" },
      { name: "Imtiaz Super Market", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Crect width='100' height='40' rx='3' fill='%2300a651'/%3E%3Ctext x='50' y='27' font-family='Arial' font-size='18' font-weight='bold' text-anchor='middle' fill='white'%3EIMTIAZ%3C/text%3E%3C/svg%3E" },
    ],
  },
  {
    category: "Automotive",
    names: [
      { name: "KIA Motors", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Cellipse cx='50' cy='20' rx='30' ry='15' fill='none' stroke='%23bb162b' stroke-width='2'/%3E%3Ctext x='50' y='25' font-family='Arial' font-size='16' font-weight='bold' text-anchor='middle' fill='%23bb162b'%3EKIA%3C/text%3E%3C/svg%3E" },
    ],
  },
  {
    category: "Shopping Malls",
    names: [
      { name: "ACE Galleria", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Arial' font-size='16' font-weight='bold' text-anchor='middle' fill='%232d3748'%3EACE GALLERIA%3C/text%3E%3C/svg%3E" },
      { name: "Shamim Pacity", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Arial' font-size='14' font-weight='bold' text-anchor='middle' fill='%234a5568'%3ESHAMIM PACITY%3C/text%3E%3C/svg%3E" },
      { name: "Sultan Plaza", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Times New Roman' font-size='16' font-weight='bold' text-anchor='middle' fill='%23000'%3ESultan Plaza%3C/text%3E%3C/svg%3E" },
    ],
  },
  {
    category: "Heritage & Government",
    names: [
      { name: "Noor Mahal", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Cpath d='M20 30 L50 10 L80 30 V35 H20 Z' fill='%23d4af37' stroke='%23000' stroke-width='1'/%3E%3Ctext x='50' y='38' font-family='Arial' font-size='10' font-weight='bold' text-anchor='middle' fill='%23000'%3ENoor Mahal%3C/text%3E%3C/svg%3E" },
      { name: "Various Corporate Offices", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Crect x='40' y='10' width='20' height='25' fill='%23718096'/%3E%3Ctext x='50' y='39' font-family='Arial' font-size='8' text-anchor='middle' fill='%234a5568'%3ECorporate Offices%3C/text%3E%3C/svg%3E" },
    ],
  },
];

export default function ProjectsPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-700 via-primary to-primary-800 text-white py-16">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Our Mega Projects
            </h1>
            <p className="text-lg text-gray-200">
              Sheriff Security has successfully covered major events and provided
              comprehensive security services throughout various activities across
              Pakistan. Our team ensures safety and smooth execution at all times.
            </p>
          </div>
        </div>
      </section>

      {/* Mega Projects */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8">Featured Projects</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {megaProjects.map((project) => (
              <Card
                key={project.title}
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-red-500/50"
              >
                <div className="bg-gradient-to-r from-primary to-primary-700 p-4">
                  <Badge className="bg-red-500 text-white mb-2 hover:bg-red-600">
                    {project.category}
                  </Badge>
                  <h3 className="text-xl font-bold text-white">
                    {project.title}
                  </h3>
                </div>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    {project.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    {project.location}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.highlights.map((highlight) => (
                      <Badge key={highlight} variant="outline" className="hover:bg-red-50 hover:border-red-300">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Brand Logos */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="container">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Trusted by Leading Brands
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Premium security services for Pakistan&apos;s most prestigious brands
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
            {brandLogos.map((brand, index) => (
              <div
                key={brand.name}
                className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-200 hover:border-red-500/50 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center h-16">
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    width={100}
                    height={40}
                    className="max-h-full w-auto object-contain group-hover:scale-110 transition-transform"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Our Valued Clients
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            We are proud to provide security services to some of Pakistan&apos;s most
            renowned companies and organizations across various industries.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clients.map((group) => (
              <Card key={group.category} className="hover:shadow-xl transition-shadow hover:border-red-500/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-primary mb-4 text-lg">
                    {group.category}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {group.names.map((client) => (
                      <div
                        key={client.name}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50/50 transition-colors border border-transparent hover:border-red-100"
                      >
                         <div className="relative w-20 h-8 flex-shrink-0 bg-white rounded border border-gray-100 flex items-center justify-center p-1">
                           <Image 
                             src={client.logo} 
                             alt={client.name} 
                             width={80}
                             height={32}
                             className="object-contain max-h-full w-auto" 
                           />
                         </div>
                        <span className="text-sm font-medium text-gray-700">{client.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-red-500 mb-2">50+</div>
              <div className="text-gray-200">Major Events</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-500 mb-2">100+</div>
              <div className="text-gray-200">Active Clients</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-500 mb-2">500+</div>
              <div className="text-gray-200">Security Personnel</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-500 mb-2">20+</div>
              <div className="text-gray-200">Years Experience</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
