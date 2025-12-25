import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, DoorOpen } from "lucide-react";

export const GreenHomeFooter = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <DoorOpen className="h-8 w-8 text-white" />
              </div>
              <span className="text-xl font-bold">Windows & Doors</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Premium impact windows and doors for South Florida homes. Hurricane protection, energy efficiency, and style.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-emerald-400">Services</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Impact Windows</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sliding Glass Doors</a></li>
              <li><a href="#" className="hover:text-white transition-colors">French Doors</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Entry Doors</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hurricane Shutters</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-emerald-400">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Reviews</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Gallery</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Financing</a></li>
              <li><Link to="/green-home-solutions/admin/auth" className="hover:text-white transition-colors">Admin Portal</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-emerald-400">Contact</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-400" />
                <a href="tel:561-815-0008" className="hover:text-white transition-colors">561-815-0008</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-400" />
                <a href="mailto:info@windowsanddoors.com" className="hover:text-white transition-colors">info@windowsanddoors.com</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-400 mt-0.5" />
                <span>South Florida<br />Serving Palm Beach, Broward & Miami-Dade</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Windows & Doors. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Licenses</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
