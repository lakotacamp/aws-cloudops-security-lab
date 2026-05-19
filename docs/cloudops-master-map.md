# CloudOps Master Map

## Purpose
This document maps the AWS CloudOps concepts covered by this portfolio project.

It connects core CloudOps domains to hands-on labs, runbooks, architecture diagrams, monitoring workflows, security documentation, and troubleshooting scenarios.

---

## 1. Compute
Core services and concepts:
- EC2
- Auto Scaling
- Elastic Load Balancing
- AMIs
- Instance types
- User data
- Instance status checks

Key question:
What runs the application, and how do I keep it available?

---

## 2. Monitoring
Core services and concepts:
- CloudWatch Metrics
- CloudWatch Logs
- CloudWatch Alarms
- Dashboards
- Log groups
- Log streams

Key question:
How do I know what is happening inside the system?

---

## 3. Access
Core services and concepts:
- IAM users
- IAM roles
- IAM policies
- Least privilege
- Permission boundaries
- Resource-based policies

Key question:
Who or what is allowed to do something?

---

## 4. Networking
Core services and concepts:
- VPC
- Subnets
- Route tables
- Internet Gateway
- NAT Gateway
- Security groups
- Network ACLs
- CIDR blocks

Key question:
Can traffic reach the right resource safely?

---

## 5. Storage
Core services and concepts:
- S3
- EBS
- EFS
- Snapshots
- Encryption
- Lifecycle policies

Key question:
Where is data stored, protected, backed up, and accessed?

---

## 6. Automation
Core services and concepts:
- Systems Manager
- EventBridge
- Lambda
- CloudFormation / Terraform
- Automation documents
- Run Command

Key question:
How do I reduce manual work and respond automatically?

---

## 7. Reliability
Core services and concepts:
- Backups
- Multi-AZ design
- Health checks
- Auto Scaling
- Alarms
- Disaster recovery basics

Key question:
How does the system recover from failure?

---

## 8. Troubleshooting
Common troubleshooting areas:
- EC2 connection issues
- IAM permission denied errors
- High CPU or memory pressure
- Disk full errors
- Failed health checks
- Network path failures
- Missing or incomplete logs

Key question:
What evidence tells me where the failure is?

---

## 9. Security Operations
Core services and concepts:
- CloudTrail
- AWS Config
- GuardDuty
- Security Hub
- IAM Access Analyzer
- Incident response
- Audit logging
- Least privilege review

Key question:
How do I detect, investigate, and reduce security risk?

---

## Portfolio Build Priorities

This project will turn the map above into hands-on AWS CloudOps artifacts, including:

- monitoring labs
- logging and audit labs
- IAM and least-privilege documentation
- troubleshooting runbooks
- architecture diagrams
- screenshots and evidence
- security and cleanup notes

## Future Expansion Areas

Planned areas for future portfolio work:

- CloudWatch alarm and metrics labs
- CloudWatch Logs and metric filter labs
- CloudTrail investigation lab
- Systems Manager operational access lab
- IAM role and policy review notes
- VPC and security group troubleshooting scenarios
- S3 log storage and evidence organization