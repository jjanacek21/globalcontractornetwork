import { Helmet } from "react-helmet";
import { GreenHomeHeader } from "@/components/green-home/GreenHomeHeader";
import { GreenHomeFooter } from "@/components/green-home/GreenHomeFooter";
import { GreenHomeHero } from "@/components/green-home/GreenHomeHero";
import { WindowQuoteCalculator } from "@/components/green-home/WindowQuoteCalculator";
import { WindowTypesGuide } from "@/components/green-home/WindowTypesGuide";
import { WindowResourceLibrary } from "@/components/green-home/WindowResourceLibrary";
import { WindowFAQ } from "@/components/green-home/WindowFAQ";

const GreenHomeSolutions = () => {
  return (
    <>
      <Helmet>
        <title>Impact Windows South Florida | Green Home Improvements | Free Quote</title>
        <meta 
          name="description" 
          content="Florida's #1 impact window installer since 2014. Get an instant quote for hurricane-rated windows. Save up to 25% with our exclusive discounts. Call 561-815-0008." 
        />
        <meta name="keywords" content="impact windows, hurricane windows, South Florida windows, window replacement, energy efficient windows, Palm Beach windows" />
      </Helmet>

      <div className="min-h-screen bg-white">
        <GreenHomeHeader />
        <GreenHomeHero />
        <WindowQuoteCalculator />
        <WindowTypesGuide />
        <WindowResourceLibrary />
        <WindowFAQ />
        <GreenHomeFooter />
      </div>
    </>
  );
};

export default GreenHomeSolutions;
