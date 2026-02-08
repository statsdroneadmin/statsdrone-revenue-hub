import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TopCountriesSection from "@/components/stats/TopCountriesSection";
import Seo from "@/components/seo/Seo";
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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SheetData {
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
}

interface PreviousData {
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
}

interface PodcastData {
  Sheet1: SheetData;
  PreviousSnapshot: PreviousData;
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

function GrowthBadge({ current, previous }: { current: number; previous: number }) {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  if (change === 0) return null;
  const isPositive = change > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
        isPositive
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-red-500/15 text-red-400"
      }`}
    >
      {isPositive ? "\u2191" : "\u2193"}
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

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
  const prev = data.PreviousSnapshot;
  const reportDate = new Date(stats.Date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const prevDate = prev
    ? new Date(prev.Date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const totalFollowers =
    stats["Spotify Followers"] +
    stats["Apple Podcast Followers"] +
    stats["YouTube Subscribers"];
  const prevTotalFollowers = prev
    ? prev["Spotify Followers"] +
      prev["Apple Podcast Followers"] +
      prev["YouTube Subscribers"]
    : 0;

  const totalPlays =
    stats["Spotify Plays"] +
    stats["Apple Podcast Plays"] +
    stats["YouTube Views"];
  const prevTotalPlays = prev
    ? prev["Spotify Plays"] + prev["Apple Podcast Plays"] + prev["YouTube Views"]
    : 0;

  const totalHours =
    stats["Spotify Hours"] +
    stats["Apple Podcast Hours"] +
    stats["YouTube Watchtime Hours"];
  const prevTotalHours = prev
    ? prev["Spotify Hours"] +
      prev["Apple Podcast Hours"] +
      prev["YouTube Watchtime Hours"]
    : 0;

  // Platform breakdown for bar chart
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

  // Age demographics
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

  const tooltipStyle = {
    backgroundColor: "hsl(252, 45%, 16%)",
    border: "1px solid hsl(252, 30%, 25%)",
    borderRadius: "8px",
    color: "#e2e2e2",
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Podcast Stats"
        description="Podcast statistics for Revenue Optimization with StatsDrone: downloads, followers, plays, demographics, and top videos."
        canonicalPath="/stats"
        ogType="website"
      />
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
              <span className="gradient-text">Podcast Stats</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Data as of {reportDate}
            </p>
            {prevDate && (
              <p className="text-muted-foreground/60 text-sm mt-1">
                Growth compared to {prevDate}
              </p>
            )}
          </div>

          {/* Key Metrics - 2x2 on mobile, 4-col on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">Total Downloads</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {stats.Downloads.toLocaleString()}
                </p>
                {prev && (
                  <div className="mt-2 flex items-center gap-2">
                    <GrowthBadge current={stats.Downloads} previous={prev.Downloads} />
                    <span className="text-xs text-muted-foreground/60">
                      +{(stats.Downloads - prev.Downloads).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">Followers</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {totalFollowers.toLocaleString()}
                </p>
                {prev && (
                  <div className="mt-2 flex items-center gap-2">
                    <GrowthBadge current={totalFollowers} previous={prevTotalFollowers} />
                    <span className="text-xs text-muted-foreground/60">
                      +{(totalFollowers - prevTotalFollowers).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">Total Plays</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {totalPlays.toLocaleString()}
                </p>
                {prev && (
                  <div className="mt-2 flex items-center gap-2">
                    <GrowthBadge current={totalPlays} previous={prevTotalPlays} />
                    <span className="text-xs text-muted-foreground/60">
                      +{(totalPlays - prevTotalPlays).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">Watch Hours</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {Math.round(totalHours).toLocaleString()}
                </p>
                {prev && (
                  <div className="mt-2 flex items-center gap-2">
                    <GrowthBadge current={totalHours} previous={prevTotalHours} />
                    <span className="text-xs text-muted-foreground/60">
                      +{Math.round(totalHours - prevTotalHours).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Platform Breakdown Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {/* Spotify */}
            <Card className="bg-card border-border overflow-hidden">
              <div className="h-1 bg-[#1DB954]" />
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg viewBox="0 0 24 24" fill="#1DB954" className="w-5 h-5">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  <span className="font-semibold text-foreground">Spotify</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Followers</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stats["Spotify Followers"]}</span>
                      {prev && <GrowthBadge current={stats["Spotify Followers"]} previous={prev["Spotify Followers"]} />}
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Plays</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stats["Spotify Plays"].toLocaleString()}</span>
                      {prev && <GrowthBadge current={stats["Spotify Plays"]} previous={prev["Spotify Plays"]} />}
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Hours</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stats["Spotify Hours"]}</span>
                      {prev && <GrowthBadge current={stats["Spotify Hours"]} previous={prev["Spotify Hours"]} />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Apple Podcasts */}
            <Card className="bg-card border-border overflow-hidden">
              <div className="h-1 bg-[#D56DFB]" />
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg viewBox="0 0 24 24" fill="#D56DFB" className="w-5 h-5">
                    <path d="M5.34 0A5.328 5.328 0 0 0 0 5.34v13.32A5.328 5.328 0 0 0 5.34 24h13.32A5.328 5.328 0 0 0 24 18.66V5.34A5.328 5.328 0 0 0 18.66 0H5.34zm6.525 2.568c4.992 0 9.066 4.074 9.066 9.066 0 5.013-4.074 9.09-9.066 9.09-5.01 0-9.09-4.077-9.09-9.09 0-4.992 4.08-9.066 9.09-9.066z" />
                  </svg>
                  <span className="font-semibold text-foreground">Apple Podcasts</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Followers</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stats["Apple Podcast Followers"]}</span>
                      {prev && <GrowthBadge current={stats["Apple Podcast Followers"]} previous={prev["Apple Podcast Followers"]} />}
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Plays</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stats["Apple Podcast Plays"].toLocaleString()}</span>
                      {prev && <GrowthBadge current={stats["Apple Podcast Plays"]} previous={prev["Apple Podcast Plays"]} />}
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Hours</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stats["Apple Podcast Hours"]}</span>
                      {prev && <GrowthBadge current={stats["Apple Podcast Hours"]} previous={prev["Apple Podcast Hours"]} />}
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Listeners</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stats["Apple Podcast Listeners"]}</span>
                      {prev && <GrowthBadge current={stats["Apple Podcast Listeners"]} previous={prev["Apple Podcast Listeners"]} />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* YouTube */}
            <Card className="bg-card border-border overflow-hidden">
              <div className="h-1 bg-[#FF0000]" />
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg viewBox="0 0 24 24" fill="#FF0000" className="w-5 h-5">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span className="font-semibold text-foreground">YouTube</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Subscribers</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stats["YouTube Subscribers"]}</span>
                      {prev && <GrowthBadge current={stats["YouTube Subscribers"]} previous={prev["YouTube Subscribers"]} />}
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Views</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stats["YouTube Views"].toLocaleString()}</span>
                      {prev && <GrowthBadge current={stats["YouTube Views"]} previous={prev["YouTube Views"]} />}
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Watch Hours</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{Math.round(stats["YouTube Watchtime Hours"])}</span>
                      {prev && <GrowthBadge current={stats["YouTube Watchtime Hours"]} previous={prev["YouTube Watchtime Hours"]} />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            {/* Platform Comparison Chart */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-lg">Platform Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(252, 30%, 25%)" />
                    <XAxis dataKey="name" stroke="hsl(252, 20%, 60%)" fontSize={12} />
                    <YAxis stroke="hsl(252, 20%, 60%)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="Followers" fill="hsl(20, 90%, 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Plays" fill="hsl(45, 95%, 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Hours" fill="hsl(252, 50%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(20, 90%, 55%)" }} />
                    <span className="text-xs text-muted-foreground">Followers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(45, 95%, 55%)" }} />
                    <span className="text-xs text-muted-foreground">Plays</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(252, 50%, 55%)" }} />
                    <span className="text-xs text-muted-foreground">Hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Age Demographics */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-lg">Spotify Age Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(252, 30%, 25%)" />
                    <XAxis dataKey="name" stroke="hsl(252, 20%, 60%)" fontSize={12} />
                    <YAxis stroke="hsl(252, 20%, 60%)" fontSize={12} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Bar dataKey="value" fill="hsl(20, 90%, 55%)" name="Percentage" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gender + Countries row */}
          <div className="grid lg:grid-cols-3 gap-6 mb-10">
            {/* Gender Distribution */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-lg">Gender Split</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {genderData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-1">
                  {genderData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-xs text-muted-foreground">
                        {item.name} {item.value.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Metrics */}
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-lg">Audience Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Countries</p>
                    <p className="text-2xl font-bold text-foreground">
                      {data["Spotify Countries"].length}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Spotify reach</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Apple Listeners</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats["Apple Podcast Listeners"]}
                    </p>
                    {prev && (
                      <div className="mt-1">
                        <GrowthBadge
                          current={stats["Apple Podcast Listeners"]}
                          previous={prev["Apple Podcast Listeners"]}
                        />
                      </div>
                    )}
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Engaged Listeners</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats["Apple Podcast Engaged Listeners"]}
                    </p>
                    {prev && (
                      <div className="mt-1">
                        <GrowthBadge
                          current={stats["Apple Podcast Engaged Listeners"]}
                          previous={prev["Apple Podcast Engaged Listeners"]}
                        />
                      </div>
                    )}
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Top Country</p>
                    <p className="text-2xl font-bold text-foreground">
                      {data["Spotify Countries"][0]?.Country}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {data["Spotify Countries"][0]?.Streams} streams
                    </p>
                  </div>
                </div>
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
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Top YouTube Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">#</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Video</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium text-sm">Views</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium text-sm">Hours</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium text-sm">Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVideos.map((video, index) => (
                      <tr key={index} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground text-sm">{index + 1}</td>
                        <td className="py-3 px-4 text-foreground text-sm max-w-md">
                          {video["Video title"]}
                        </td>
                        <td className="py-3 px-4 text-right text-foreground font-medium text-sm">
                          {video.Views.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-foreground text-sm">
                          {video["Watch time (hours)"].toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground text-sm whitespace-nowrap">
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
