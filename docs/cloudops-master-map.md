# CloudOps Master Map

## Purpose
This document is my high-level map of AWS Cloud Operations concepts. I will update it as I study for the AWS CloudOps Engineer certification and build hands-on labs.

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

## Study Notes
Add new notes here as concepts become clearer.

## Confusing Topics
Add confusing topics here so they can be reviewed later.

## Exam Patterns
Add common exam patterns here as they appear in practice questions.