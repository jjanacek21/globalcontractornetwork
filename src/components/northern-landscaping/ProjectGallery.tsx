import { Camera } from "lucide-react";

const ProjectGallery = () => {
  const placeholderCategories = [
    "Pool Landscaping",
    "Tree Care",
    "Garden Design",
    "Hardscaping",
    "Lawn Maintenance",
    "Tropical Plants",
  ];

  return (
    <section id="gallery" className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">
            Our Work
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-green-900 mt-2 mb-4">
            Project Gallery
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our portfolio of luxury landscaping projects across South Florida.
          </p>
        </div>

        {/* Gallery Grid - Placeholder cards ready for photos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderCategories.map((category, i) => (
            <div
              key={i}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-green-100 via-green-50 to-emerald-100 flex items-center justify-center group hover:shadow-lg transition-shadow"
            >
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-200/50 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Camera className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-green-800 font-semibold">{category}</p>
                <p className="text-green-600 text-sm mt-1">Photo Coming Soon</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectGallery;
