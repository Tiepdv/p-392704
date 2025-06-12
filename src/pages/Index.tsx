
import React from "react";
import { Target, Search, Filter, Eye, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="container mx-auto px-4">
        <header className="mb-16 text-center">
          <h1 className="text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent">
            Welcome to Ads.txt Management
          </h1>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
             Your comprehensive flow for managing, analyzing, and optimizing ads.txt lines with filtering and visualization tools
            {profile?.role === 'admin' && (
              <span className="block mt-3 text-green-400 font-medium text-lg">(Administrator Access)</span>
            )}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Goals Section */}
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border border-green-500/30 shadow-xl rounded-xl p-8 hover:shadow-green-500/10 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-500/20 rounded-full mr-4">
                <Target className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Our Goals</h2>
            </div>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2.5 mr-4 flex-shrink-0"></span>
                <span className="leading-relaxed">Customize ads.txt lines for multiple markets</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2.5 mr-4 flex-shrink-0"></span>
                <span className="leading-relaxed">Provide data visualization and analytics</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2.5 mr-4 flex-shrink-0"></span>
                <span className="leading-relaxed">Enable efficient filtering and search capabilities</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2.5 mr-4 flex-shrink-0"></span>
                <span className="leading-relaxed">Help decision makings with dynamic data insights</span>
              </li>
            </ul>
          </div>

          {/* Features Section */}
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border border-green-500/30 shadow-xl rounded-xl p-8 hover:shadow-green-500/10 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-500/20 rounded-full mr-4">
                <Search className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Key Features</h2>
            </div>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <Filter className="h-5 w-5 text-green-400 mt-1 mr-4 flex-shrink-0" />
                <span className="leading-relaxed">Advanced filtering and search functionality</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 bg-green-400 rounded mt-1 mr-4 flex-shrink-0"></div>
                <span className="leading-relaxed">Interactive data tables with sorting capabilities</span>
              </li>
              <li className="flex items-start">
                <Eye className="h-5 w-5 text-green-400 mt-1 mr-4 flex-shrink-0" />
                <span className="leading-relaxed">Column visibility controls for customized views</span>
              </li>
              <li className="flex items-start">
                <Settings className="h-5 w-5 text-green-400 mt-1 mr-4 flex-shrink-0" />
                <span className="leading-relaxed">Role-based access control and permissions</span>
              </li>
            </ul>
          </div>

          {/* Instructions Section */}
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border border-green-500/30 shadow-xl rounded-xl p-8 hover:shadow-green-500/10 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-green-400 rounded-full flex items-center justify-center mr-4">
                <span className="text-black font-bold text-lg">?</span>
              </div>
              <h2 className="text-2xl font-semibold text-white">How to Use</h2>
            </div>
            <ol className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <span className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold flex items-center justify-center mt-0.5 mr-4 flex-shrink-0">1</span>
                <span className="leading-relaxed">Select the number of weeks to see data in the Explore tab</span>
              </li>
              <li className="flex items-start">
                <span className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold flex items-center justify-center mt-0.5 mr-4 flex-shrink-0">2</span>
                <span className="leading-relaxed">Use search and filter tools to find specific data</span>
              </li>
              <li className="flex items-start">
                <span className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold flex items-center justify-center mt-0.5 mr-4 flex-shrink-0">3</span>
                <span className="leading-relaxed">Click column headers to sort data ascending or descending</span>
              </li>
              <li className="flex items-start">
                <span className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold flex items-center justify-center mt-0.5 mr-4 flex-shrink-0">4</span>
                <span className="leading-relaxed">Customize your view with column visibility controls</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Available Tabs */}
        <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border border-green-500/30 shadow-xl rounded-xl p-10">
          <h2 className="text-4xl font-semibold text-white mb-8 text-center bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">Available Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 border border-green-500/40 rounded-xl hover:shadow-lg hover:bg-green-500/5 hover:border-green-400/60 transition-all duration-300 group">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
                <div className="w-8 h-8 bg-green-400 rounded"></div>
              </div>
              <h3 className="font-semibold text-white mb-3 text-lg">Market Lines</h3>
              <p className="text-sm text-gray-400 leading-relaxed">View and analyze market line data with filtering and sorting capabilities</p>
            </div>
            
            <div className="text-center p-6 border border-green-500/40 rounded-xl hover:shadow-lg hover:bg-green-500/5 hover:border-green-400/60 transition-all duration-300 group">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
                <Book className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-3 text-lg">Library</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Access your comprehensive data library with advanced search features</p>
            </div>

            <div className="text-center p-6 border border-green-500/40 rounded-xl hover:shadow-lg hover:bg-green-500/5 hover:border-green-400/60 transition-all duration-300 group">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
                <Search className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-3 text-lg">Explore</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Analyze data using various time periods</p>
            </div>
            
            
            {profile?.role !== 'viewer' && (
              <>
                <div className="text-center p-6 border border-green-500/40 rounded-xl hover:shadow-lg hover:bg-green-500/5 hover:border-green-400/60 transition-all duration-300 group">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
                    <Settings className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-3 text-lg">SH Sellers.json</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">Manage and view sellers.json data for your domains</p>
                </div>
                
                <div className="text-center p-6 border border-green-500/40 rounded-xl hover:shadow-lg hover:bg-green-500/5 hover:border-green-400/60 transition-all duration-300 group">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
                    <Eye className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-3 text-lg">Explore</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">Explore regional data and analytics across different markets</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-lg">
            Start exploring by selecting a tab from the navigation above
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
