import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import gallery1 from "@/assets/northern-landscaping/gallery-1.jpg";
import gallery2 from "@/assets/northern-landscaping/gallery-2.jpg";

// Create array with available images
const galleryImages = [
  {
    src: gallery1,
    alt: "Luxury landscape with pool and tropical plants",
    category: "Pool Landscaping",
  },
  {
    src: gallery2,
    alt: "Professional tree trimming service",
    category: "Tree Care",
  },
];

const ProjectGallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % galleryImages.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1
      );
    }
  };

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

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-semibold">{image.category}</p>
                </div>
              </div>
            </button>
          ))}

          {/* Placeholder cards for visual balance */}
          {[...Array(4)].map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center"
            >
              <div className="text-center p-6">
                <p className="text-green-700 font-semibold">More Projects Coming</p>
                <p className="text-green-600 text-sm">View our latest work</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        <Dialog open={selectedImage !== null} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-5xl p-0 bg-black/95 border-none">
            <div className="relative">
              {selectedImage !== null && (
                <img
                  src={galleryImages[selectedImage].src}
                  alt={galleryImages[selectedImage].alt}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>

              {selectedImage !== null && (
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-semibold">
                    {galleryImages[selectedImage].category}
                  </p>
                  <p className="text-sm text-white/70">
                    {selectedImage + 1} of {galleryImages.length}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default ProjectGallery;
