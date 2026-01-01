import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface SpotifyCountry {
  Country: string;
  Streams: number;
}

interface AppleCountryRaw {
  [key: string]: string | number;
}

interface TopCountriesSectionProps {
  spotifyCountries: SpotifyCountry[];
  appleCountriesRaw: AppleCountryRaw[];
}

interface CountryData {
  country: string;
  value: number;
}

// Map country names to match GeoJSON names
const countryNameMap: Record<string, string> = {
  "United States": "United States of America",
  "United Kingdom": "United Kingdom",
  "Türkiye": "Turkey",
};

const TopCountriesSection = ({
  spotifyCountries,
  appleCountriesRaw,
}: TopCountriesSectionProps) => {
  const [platform, setPlatform] = useState<"spotify" | "apple">("spotify");
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<{
    country: string;
    value: number;
  } | null>(null);

  // Parse Apple countries data (unusual format from JSON export)
  const appleCountries = useMemo(() => {
    const result: CountryData[] = [];
    
    // First entry has "United States" as key with value 71
    const firstEntry = appleCountriesRaw[0];
    if (firstEntry) {
      const keys = Object.keys(firstEntry);
      const countryKey = keys.find(k => isNaN(Number(k)));
      const valueKey = keys.find(k => !isNaN(Number(k)));
      if (countryKey && valueKey) {
        result.push({ country: countryKey, value: Number(valueKey) });
      }
    }
    
    // Rest have country name in first key's value and listener count in second key's value
    appleCountriesRaw.forEach((item) => {
      const keys = Object.keys(item);
      const countryKey = keys.find(k => isNaN(Number(k)));
      const valueKey = keys.find(k => !isNaN(Number(k)));
      if (countryKey && valueKey) {
        const countryName = item[countryKey] as string;
        const value = item[valueKey] as number;
        if (countryName && !result.find(r => r.country === countryName)) {
          result.push({ country: countryName, value });
        }
      }
    });
    
    return result.sort((a, b) => b.value - a.value);
  }, [appleCountriesRaw]);

  const spotifyData: CountryData[] = useMemo(
    () =>
      spotifyCountries.map((c) => ({
        country: c.Country,
        value: c.Streams,
      })),
    [spotifyCountries]
  );

  const currentData = platform === "spotify" ? spotifyData : appleCountries;
  const top10 = currentData.slice(0, 10);
  const maxValue = Math.max(...currentData.map((c) => c.value));

  const getCountryColor = (geoName: string) => {
    const normalizedGeoName = geoName;
    const countryData = currentData.find((c) => {
      const mappedName = countryNameMap[c.country] || c.country;
      return (
        mappedName.toLowerCase() === normalizedGeoName.toLowerCase() ||
        c.country.toLowerCase() === normalizedGeoName.toLowerCase()
      );
    });

    if (!countryData) return "hsl(252, 30%, 20%)";

    const intensity = countryData.value / maxValue;
    if (platform === "spotify") {
      return `hsl(142, ${60 + intensity * 30}%, ${25 + intensity * 35}%)`;
    } else {
      return `hsl(280, ${60 + intensity * 30}%, ${25 + intensity * 35}%)`;
    }
  };

  const handleMouseEnter = (geo: { properties: { name: string } }) => {
    const geoName = geo.properties.name;
    const countryData = currentData.find((c) => {
      const mappedName = countryNameMap[c.country] || c.country;
      return (
        mappedName.toLowerCase() === geoName.toLowerCase() ||
        c.country.toLowerCase() === geoName.toLowerCase()
      );
    });

    setHoveredCountry(geoName);
    if (countryData) {
      setTooltipContent({ country: countryData.country, value: countryData.value });
    } else {
      setTooltipContent(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCountry(null);
    setTooltipContent(null);
  };

  return (
    <Card className="bg-card border-border mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Top Countries</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={platform === "spotify" ? "default" : "outline"}
            size="sm"
            onClick={() => setPlatform("spotify")}
            className={platform === "spotify" ? "bg-[#1DB954] hover:bg-[#1aa34a]" : ""}
          >
            Spotify
          </Button>
          <Button
            variant={platform === "apple" ? "default" : "outline"}
            size="sm"
            onClick={() => setPlatform("apple")}
            className={platform === "apple" ? "bg-[#FC3C44] hover:bg-[#e0353c]" : ""}
          >
            Apple Podcasts
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Map */}
          <div className="relative">
            <TooltipProvider>
              <Tooltip open={!!tooltipContent}>
                <TooltipTrigger asChild>
                  <div className="w-full h-[400px] bg-background/50 rounded-lg overflow-hidden">
                    <ComposableMap
                      projectionConfig={{
                        rotate: [-10, 0, 0],
                        scale: 147,
                      }}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <ZoomableGroup center={[0, 20]} zoom={1}>
                        <Geographies geography={geoUrl}>
                          {({ geographies }) =>
                            geographies.map((geo) => (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={getCountryColor(geo.properties.name)}
                                stroke="hsl(252, 30%, 30%)"
                                strokeWidth={0.5}
                                onMouseEnter={() => handleMouseEnter(geo)}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                  default: { outline: "none" },
                                  hover: {
                                    fill:
                                      platform === "spotify"
                                        ? "hsl(142, 80%, 50%)"
                                        : "hsl(280, 80%, 50%)",
                                    outline: "none",
                                    cursor: "pointer",
                                  },
                                  pressed: { outline: "none" },
                                }}
                              />
                            ))
                          }
                        </Geographies>
                      </ZoomableGroup>
                    </ComposableMap>
                  </div>
                </TooltipTrigger>
                {tooltipContent && (
                  <TooltipContent className="bg-card border-border">
                    <p className="font-semibold">{tooltipContent.country}</p>
                    <p className="text-muted-foreground">
                      {platform === "spotify" ? "Streams" : "Listeners"}:{" "}
                      {tooltipContent.value.toLocaleString()}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Table */}
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">
                    {platform === "spotify" ? "Streams" : "Listeners"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top10.map((country, index) => (
                  <TableRow key={country.country}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{country.country}</TableCell>
                    <TableCell className="text-right">
                      {country.value.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopCountriesSection;
