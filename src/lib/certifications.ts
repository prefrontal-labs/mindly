import { Certification } from "@/types";

export const certifications: Certification[] = [
  {
    id: "aws-saa-c03",
    name: "AWS Solutions Architect Associate",
    code: "SAA-C03",
    provider: "AWS",
    description:
      "Validate your ability to design and implement distributed systems on AWS. Covers compute, storage, networking, security, and cost optimization.",
    icon: "☁️",
    color: "from-orange-500 to-yellow-500",
  },
  {
    id: "gcp-ace",
    name: "Google Cloud Associate Cloud Engineer",
    code: "ACE",
    provider: "GCP",
    description:
      "Demonstrate your ability to deploy applications, monitor operations, and manage enterprise solutions on Google Cloud.",
    icon: "🌐",
    color: "from-blue-500 to-green-500",
  },
  {
    id: "az-900",
    name: "Microsoft Azure Fundamentals",
    code: "AZ-900",
    provider: "Azure",
    description:
      "Prove your foundational knowledge of cloud concepts, Azure services, security, privacy, pricing, and support.",
    icon: "🔷",
    color: "from-blue-600 to-cyan-500",
  },
];

export function getCertification(id: string): Certification | undefined {
  return certifications.find((c) => c.id === id);
}
