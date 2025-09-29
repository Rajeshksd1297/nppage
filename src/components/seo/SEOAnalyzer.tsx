import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, XCircle, Target, Lightbulb, TrendingUp } from 'lucide-react';

interface SEOAnalysis {
  score: number;
  issues: SEOIssue[];
  recommendations: string[];
  keywords: KeywordAnalysis[];
  readability: ReadabilityScore;
  technical: TechnicalSEO;
}

interface SEOIssue {
  type: 'error' | 'warning' | 'success';
  category: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

interface KeywordAnalysis {
  keyword: string;
  density: number;
  count: number;
  recommended: boolean;
}

interface ReadabilityScore {
  score: number;
  level: string;
  avgSentenceLength: number;
  avgWordLength: number;
  issues: string[];
}

interface TechnicalSEO {
  metaTitle: { status: 'good' | 'warning' | 'error'; message: string };
  metaDescription: { status: 'good' | 'warning' | 'error'; message: string };
  headings: { status: 'good' | 'warning' | 'error'; message: string };
  images: { status: 'good' | 'warning' | 'error'; message: string };
  links: { status: 'good' | 'warning' | 'error'; message: string };
}

interface SEOAnalyzerProps {
  content: string;
  title: string;
  description: string;
  keywords: string[];
  focusKeyword?: string;
}

export const SEOAnalyzer: React.FC<SEOAnalyzerProps> = ({
  content,
  title,
  description,
  keywords,
  focusKeyword
}) => {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (content || title || description) {
      analyzeContent();
    }
  }, [content, title, description, keywords, focusKeyword]);

  const analyzeContent = () => {
    setLoading(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      const newAnalysis = performSEOAnalysis();
      setAnalysis(newAnalysis);
      setLoading(false);
    }, 1000);
  };

  const performSEOAnalysis = (): SEOAnalysis => {
    const issues: SEOIssue[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Analyze title
    const titleAnalysis = analyzeTitleTag(title);
    if (titleAnalysis.status !== 'good') {
      issues.push({
        type: titleAnalysis.status === 'error' ? 'error' : 'warning',
        category: 'Title',
        message: titleAnalysis.message,
        priority: 'high'
      });
      score -= titleAnalysis.status === 'error' ? 15 : 8;
    }

    // Analyze meta description
    const descAnalysis = analyzeMetaDescription(description);
    if (descAnalysis.status !== 'good') {
      issues.push({
        type: descAnalysis.status === 'error' ? 'error' : 'warning',
        category: 'Meta Description',
        message: descAnalysis.message,
        priority: 'high'
      });
      score -= descAnalysis.status === 'error' ? 12 : 6;
    }

    // Analyze content structure
    const headingAnalysis = analyzeHeadings(content);
    if (headingAnalysis.status !== 'good') {
      issues.push({
        type: headingAnalysis.status === 'error' ? 'error' : 'warning',
        category: 'Content Structure',
        message: headingAnalysis.message,
        priority: 'medium'
      });
      score -= 8;
    }

    // Analyze keyword usage
    const keywordAnalysis = analyzeKeywords(content, title, description, focusKeyword);
    
    // Generate recommendations
    if (score < 80) {
      recommendations.push("Optimize your meta title and description for better search visibility");
    }
    if (keywordAnalysis.length === 0) {
      recommendations.push("Add relevant keywords to improve content targeting");
    }
    if (content.length < 300) {
      recommendations.push("Increase content length to at least 300 words for better SEO");
    }

    const readability = analyzeReadability(content);
    const technical: TechnicalSEO = {
      metaTitle: titleAnalysis,
      metaDescription: descAnalysis,
      headings: headingAnalysis,
      images: analyzeImages(content),
      links: analyzeLinks(content)
    };

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
      keywords: keywordAnalysis,
      readability,
      technical
    };
  };

  const analyzeTitleTag = (title: string) => {
    if (!title) {
      return { status: 'error' as const, message: 'Missing title tag - add a compelling title' };
    }
    if (title.length < 30) {
      return { status: 'warning' as const, message: 'Title too short - aim for 30-60 characters' };
    }
    if (title.length > 60) {
      return { status: 'warning' as const, message: 'Title too long - keep under 60 characters' };
    }
    return { status: 'good' as const, message: 'Title length is optimal' };
  };

  const analyzeMetaDescription = (description: string) => {
    if (!description) {
      return { status: 'error' as const, message: 'Missing meta description - add a compelling description' };
    }
    if (description.length < 120) {
      return { status: 'warning' as const, message: 'Description too short - aim for 120-160 characters' };
    }
    if (description.length > 160) {
      return { status: 'warning' as const, message: 'Description too long - keep under 160 characters' };
    }
    return { status: 'good' as const, message: 'Meta description length is optimal' };
  };

  const analyzeHeadings = (content: string) => {
    const h1Count = (content.match(/<h1/gi) || []).length;
    const h2Count = (content.match(/<h2/gi) || []).length;
    
    if (h1Count === 0) {
      return { status: 'error' as const, message: 'Missing H1 tag - add a main heading' };
    }
    if (h1Count > 1) {
      return { status: 'warning' as const, message: 'Multiple H1 tags found - use only one H1 per page' };
    }
    if (h2Count === 0) {
      return { status: 'warning' as const, message: 'No H2 tags found - add subheadings for better structure' };
    }
    return { status: 'good' as const, message: 'Heading structure is well organized' };
  };

  const analyzeImages = (content: string) => {
    const images = content.match(/<img[^>]*>/gi) || [];
    const imagesWithoutAlt = images.filter(img => !img.includes('alt=') || img.includes('alt=""'));
    
    if (imagesWithoutAlt.length > 0) {
      return { status: 'warning' as const, message: `${imagesWithoutAlt.length} images missing alt text` };
    }
    return { status: 'good' as const, message: 'All images have alt text' };
  };

  const analyzeLinks = (content: string) => {
    const links = content.match(/<a[^>]*href[^>]*>/gi) || [];
    const externalLinks = links.filter(link => link.includes('http') && !link.includes(window.location.hostname));
    const noFollowLinks = externalLinks.filter(link => link.includes('rel="nofollow"'));
    
    if (externalLinks.length > 0 && noFollowLinks.length < externalLinks.length) {
      return { status: 'warning' as const, message: 'Consider adding rel="nofollow" to external links' };
    }
    return { status: 'good' as const, message: 'Link structure is optimized' };
  };

  const analyzeKeywords = (content: string, title: string, description: string, focusKeyword?: string): KeywordAnalysis[] => {
    const allText = `${title} ${description} ${content}`.toLowerCase();
    const words = allText.match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    
    const keywordDensity: { [key: string]: number } = {};
    
    // Count keyword occurrences
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const count = (allText.match(new RegExp(`\\b${keywordLower}\\b`, 'g')) || []).length;
      keywordDensity[keyword] = count;
    });

    if (focusKeyword) {
      const focusCount = (allText.match(new RegExp(`\\b${focusKeyword.toLowerCase()}\\b`, 'g')) || []).length;
      keywordDensity[focusKeyword] = focusCount;
    }

    return Object.entries(keywordDensity).map(([keyword, count]) => ({
      keyword,
      count,
      density: Math.round((count / wordCount) * 100 * 100) / 100,
      recommended: count > 0 && count < wordCount * 0.03 // 0-3% density is good
    }));
  };

  const analyzeReadability = (content: string): ReadabilityScore => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.match(/\b\w+\b/g) || [];
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    const avgWordLength = words.length > 0 ? words.join('').length / words.length : 0;
    
    let score = 100;
    const issues: string[] = [];
    
    if (avgSentenceLength > 20) {
      score -= 15;
      issues.push('Sentences are too long - aim for under 20 words per sentence');
    }
    
    if (avgWordLength > 5) {
      score -= 10;
      issues.push('Words are too complex - use simpler language where possible');
    }

    let level = 'Very Easy';
    if (score < 90) level = 'Easy';
    if (score < 80) level = 'Fairly Easy';
    if (score < 70) level = 'Standard';
    if (score < 60) level = 'Fairly Difficult';
    if (score < 50) level = 'Difficult';
    if (score < 30) level = 'Very Difficult';

    return {
      score: Math.max(0, score),
      level,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
      issues
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyzing SEO...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* SEO Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            SEO Score
          </CardTitle>
          <CardDescription>
            Overall SEO performance analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">
              <span className={getScoreColor(analysis.score)}>
                {analysis.score}
              </span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <div className="flex-1">
              <Progress 
                value={analysis.score} 
                className="h-3"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {analysis.score >= 80 ? 'Excellent' : 
                 analysis.score >= 60 ? 'Good' : 'Needs Improvement'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="readability">Readability</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Issues Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.issues.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  No issues found - great job!
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.issues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {issue.type === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : issue.type === 'warning' ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={issue.priority === 'high' ? 'destructive' : 
                                        issue.priority === 'medium' ? 'default' : 'secondary'}>
                            {issue.category}
                          </Badge>
                          <Badge variant="outline">{issue.priority} priority</Badge>
                        </div>
                        <p className="mt-1 text-sm">{issue.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.recommendations.length === 0 ? (
                <p className="text-muted-foreground">No recommendations at this time.</p>
              ) : (
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{content.length}</div>
                  <div className="text-sm text-muted-foreground">Characters</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{(content.match(/\b\w+\b/g) || []).length}</div>
                  <div className="text-sm text-muted-foreground">Words</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{(content.split(/[.!?]+/) || []).length}</div>
                  <div className="text-sm text-muted-foreground">Sentences</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.keywords.length === 0 ? (
                <p className="text-muted-foreground">No keywords to analyze.</p>
              ) : (
                <div className="space-y-3">
                  {analysis.keywords.map((kw, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{kw.keyword}</div>
                        <div className="text-sm text-muted-foreground">
                          Used {kw.count} times ({kw.density}% density)
                        </div>
                      </div>
                      <Badge variant={kw.recommended ? 'default' : 'destructive'}>
                        {kw.recommended ? 'Good' : 'Optimize'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Readability Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">
                  <span className={getScoreColor(analysis.readability.score)}>
                    {analysis.readability.score}
                  </span>
                  <span className="text-muted-foreground">/100</span>
                </div>
                <div className="flex-1">
                  <Progress value={analysis.readability.score} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {analysis.readability.level}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="text-lg font-semibold">{analysis.readability.avgSentenceLength}</div>
                  <div className="text-sm text-muted-foreground">Avg. Sentence Length</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-lg font-semibold">{analysis.readability.avgWordLength}</div>
                  <div className="text-sm text-muted-foreground">Avg. Word Length</div>
                </div>
              </div>

              {analysis.readability.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Readability Issues:</h4>
                  <ul className="space-y-1">
                    {analysis.readability.issues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(analysis.technical).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-sm text-muted-foreground">{value.message}</div>
                  </div>
                  <Badge variant={
                    value.status === 'good' ? 'default' : 
                    value.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {value.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};