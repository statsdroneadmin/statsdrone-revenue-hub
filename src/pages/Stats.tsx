import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TopCountriesSection from "@/components/stats/TopCountriesSection";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones, Users, Play, Clock, TrendingUp, Globe } from "lucide-react";

interface PodcastData {
  Sheet1: {
    Date: string;
    Downloads: number;
    "Apple Podcast Followers": number;
    "Apple Podcast Listeners": number;
    "Apple Podcast Engaged Listeners": number;
    "Apple Podcast Plays": number;
    "Apple Podcast Hours": number;
    "Spotify Followers": number;
    "Spotify Plays": number;
    "Spotify Hours": number;
    "YouTube Subscribers": number;
    "YouTube Views": number;
    "YouTube Watchtime Hours": number;
    "Spotify Female %": number;
    "Spotify Male %": number;
    "Spotify Gender Not Defined %": number;
    "Spotify age 18-22": number;
    "Spotify age 23-27": number;
    "Spotify age 28-34": number;
    "Spotify age 35-44": number;
    "Spotify age 45-59": number;
    "Spotify age 60+": number;
  };
  "YouTube ": Array<{
    "Video title": string;
    "Video publish time": string;
    Views: number;
    "Watch time (hours)": number;
  }>;
  "Spotify Countries": Array<{
    Country: string;
    Streams: number;
  }>;
  "Apple Podcast Countries": Array<{
    [key: string]: string | number;
  }>;
}

const COLORS = [
  "hsl(20, 90%, 55%)",
  "hsl(45, 95%, 55%)",
  "hsl(252, 50%, 55%)",
  "hsl(195, 60%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(280, 60%, 55%)",
];

const Stats = () => {
  const [data, setData] = useState<PodcastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/revenue_data_all_sheets_dec_31_2025.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading stats...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Failed to load stats</div>
      </div>
    );
  }

  const stats = data.Sheet1;
  const reportDate = new Date(stats.Date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Platform comparison data
  const platformData = [
    {
      name: "Spotify",
      Followers: stats["Spotify Followers"],
      Plays: stats["Spotify Plays"],
      Hours: stats["Spotify Hours"],
    },
    {
      name: "Apple",
      Followers: stats["Apple Podcast Followers"],
      Plays: stats["Apple Podcast Plays"],
      Hours: stats["Apple Podcast Hours"],
    },
    {
      name: "YouTube",
      Followers: stats["YouTube Subscribers"],
      Plays: stats["YouTube Views"],
      Hours: Math.round(stats["YouTube Watchtime Hours"]),
    },
  ];

  // Age demographics data
  const ageData = [
    { name: "18-22", value: stats["Spotify age 18-22"] * 100 },
    { name: "23-27", value: stats["Spotify age 23-27"] * 100 },
    { name: "28-34", value: stats["Spotify age 28-34"] * 100 },
    { name: "35-44", value: stats["Spotify age 35-44"] * 100 },
    { name: "45-59", value: stats["Spotify age 45-59"] * 100 },
    { name: "60+", value: stats["Spotify age 60+"] * 100 },
  ];

  // Gender data
  const genderData = [
    { name: "Male", value: stats["Spotify Male %"] * 100 },
    { name: "Female", value: stats["Spotify Female %"] * 100 },
    { name: "Not Defined", value: stats["Spotify Gender Not Defined %"] * 100 },
  ];

  // Top YouTube videos (top 10)
  const topVideos = data["YouTube "].slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Podcast Statistics</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Data as of {reportDate}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Headphones className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold text-foreground">
                  {stats.Downloads.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold text-foreground">
                  {(stats["Spotify Followers"] + stats["Apple Podcast Followers"] + stats["YouTube Subscribers"]).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Followers</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Play className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold text-foreground">
                  {(stats["Spotify Plays"] + stats["Apple Podcast Plays"] + stats["YouTube Views"]).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Plays</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(stats["Spotify Hours"] + stats["Apple Podcast Hours"] + stats["YouTube Watchtime Hours"]).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Watch Hours</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold text-foreground">
                  {stats["Spotify Followers"]}
                </p>
                <p className="text-sm text-muted-foreground">Spotify Followers</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Globe className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold text-foreground">
                  {data["Spotify Countries"].length}
                </p>
                <p className="text-sm text-muted-foreground">Countries</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Platform Comparison */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Platform Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(252, 30%, 25%)" />
                    <XAxis dataKey="name" stroke="hsl(252, 20%, 70%)" />
                    <YAxis stroke="hsl(252, 20%, 70%)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(252, 45%, 16%)",
                        border: "1px solid hsl(252, 30%, 25%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Followers" fill="hsl(20, 90%, 55%)" />
                    <Bar dataKey="Plays" fill="hsl(45, 95%, 55%)" />
                    <Bar dataKey="Hours" fill="hsl(252, 50%, 55%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Age Demographics */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Spotify Age Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(252, 30%, 25%)" />
                    <XAxis dataKey="name" stroke="hsl(252, 20%, 70%)" />
                    <YAxis stroke="hsl(252, 20%, 70%)" tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(252, 45%, 16%)",
                        border: "1px solid hsl(252, 30%, 25%)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Bar dataKey="value" fill="hsl(20, 90%, 55%)" name="Percentage" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gender Distribution */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Spotify Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(252, 45%, 16%)",
                        border: "1px solid hsl(252, 30%, 25%)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>

          {/* Top Countries Section */}
          <TopCountriesSection
            spotifyCountries={data["Spotify Countries"]}
            appleCountriesRaw={data["Apple Podcast Countries"] || []}
          />

          {/* Top YouTube Videos */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Top YouTube Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Video Title</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Views</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Watch Hours</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVideos.map((video, index) => (
                      <tr key={index} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-3 px-4 text-foreground">{video["Video title"]}</td>
                        <td className="py-3 px-4 text-right text-foreground">{video.Views.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-foreground">{video["Watch time (hours)"].toFixed(1)}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {new Date(video["Video publish time"]).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Stats;
