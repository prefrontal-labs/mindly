import { NextResponse } from "next/server";
import groq, { AI_MODEL } from "@/lib/groq";
import { generateRoadmapPrompt } from "@/lib/prompts/roadmap";

export async function POST(request: Request) {
  try {
    const { certification, experienceLevel } = await request.json();

    const prompt = generateRoadmapPrompt(certification, experienceLevel);

    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content || "[]";

    // Parse JSON from the response, handling potential markdown wrapping
    let roadmap;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      roadmap = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, return a default roadmap
      roadmap = getDefaultRoadmap(experienceLevel);
    }

    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error("Roadmap generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}

function getDefaultRoadmap(level: string) {
  const sections = [
    { title: "Cloud Computing Fundamentals", description: "Understanding cloud computing concepts, AWS global infrastructure, and core services overview", topics: ["Cloud computing models (IaaS, PaaS, SaaS)", "AWS Global Infrastructure", "AWS Well-Architected Framework", "Shared Responsibility Model"], estimated_hours: 3, order: 1 },
    { title: "IAM & Security", description: "Identity and Access Management, security best practices, and compliance", topics: ["IAM Users, Groups, Roles", "IAM Policies & Permissions", "Multi-Factor Authentication", "AWS Organizations & SCPs", "AWS Security Services"], estimated_hours: 4, order: 2 },
    { title: "VPC & Networking", description: "Virtual Private Cloud, subnets, route tables, and network security", topics: ["VPC Architecture", "Subnets & Route Tables", "Security Groups & NACLs", "VPC Peering & Transit Gateway", "VPN & Direct Connect"], estimated_hours: 5, order: 3 },
    { title: "EC2 & Compute", description: "Elastic Compute Cloud instances, Auto Scaling, and load balancing", topics: ["EC2 Instance Types", "AMIs & User Data", "Auto Scaling Groups", "Elastic Load Balancing", "Placement Groups"], estimated_hours: 5, order: 4 },
    { title: "S3 & Storage", description: "Simple Storage Service, EBS, EFS, and storage gateway solutions", topics: ["S3 Storage Classes", "S3 Versioning & Lifecycle", "S3 Security & Encryption", "EBS Volume Types", "EFS & FSx"], estimated_hours: 4, order: 5 },
    { title: "Databases on AWS", description: "RDS, DynamoDB, Aurora, and other database services", topics: ["RDS & Multi-AZ", "Amazon Aurora", "DynamoDB", "ElastiCache", "Database Migration Service"], estimated_hours: 5, order: 6 },
    { title: "High Availability & Fault Tolerance", description: "Designing resilient architectures with redundancy and failover", topics: ["Multi-AZ Deployments", "Cross-Region Replication", "Disaster Recovery Strategies", "Route 53 Routing Policies", "Health Checks & Failover"], estimated_hours: 4, order: 7 },
    { title: "Serverless & Application Services", description: "Lambda, API Gateway, SQS, SNS, and event-driven architecture", topics: ["AWS Lambda", "API Gateway", "SQS & SNS", "Step Functions", "EventBridge"], estimated_hours: 4, order: 8 },
    { title: "Monitoring & Management", description: "CloudWatch, CloudTrail, AWS Config, and operational excellence", topics: ["CloudWatch Metrics & Alarms", "CloudTrail", "AWS Config", "Systems Manager", "Trusted Advisor"], estimated_hours: 3, order: 9 },
    { title: "Cost Optimization", description: "AWS pricing models, cost management tools, and optimization strategies", topics: ["AWS Pricing Models", "Reserved & Spot Instances", "AWS Cost Explorer", "Savings Plans", "Cost Allocation Tags"], estimated_hours: 3, order: 10 },
    { title: "Migration & Transfer", description: "AWS migration strategies and data transfer services", topics: ["6R Migration Strategies", "AWS Migration Hub", "Server Migration Service", "Snowball & DataSync", "Application Discovery Service"], estimated_hours: 3, order: 11 },
    { title: "Exam Preparation & Review", description: "Practice exams, review key concepts, and exam-day strategies", topics: ["Practice Exam Review", "Key Concepts Summary", "Common Exam Scenarios", "Time Management Tips", "Exam Day Checklist"], estimated_hours: 4, order: 12 },
  ];

  if (level === "beginner") {
    sections.unshift({
      title: "Getting Started with AWS",
      description: "Setting up your AWS account and understanding the console",
      topics: ["AWS Free Tier", "AWS Management Console", "AWS CLI Basics", "Creating Your First Resources"],
      estimated_hours: 2,
      order: 0,
    });
    sections.forEach((s, i) => (s.order = i + 1));
  }

  return sections;
}
