# AWS CloudOps Security Lab — Architecture Diagram v1

## Purpose

This first-version architecture diagram shows the planned monitoring, logging, access, and operational-management components for the AWS CloudOps Security Lab.

This diagram is intentionally simple. It is a starting point for the portfolio project and will be expanded as hands-on labs are added.

## Diagram

```mermaid
flowchart LR
    Admin["User / Admin<br/>AWS Console or CLI"] --> IAM["IAM<br/>Users, roles, policies"]
    Admin --> CW["Amazon CloudWatch<br/>Metrics, logs, alarms"]
    Admin --> CT["AWS CloudTrail<br/>API activity auditing"]
    Admin --> SSM["AWS Systems Manager<br/>Operational access"]

    IAM --> Role["EC2 IAM Role<br/>Least-privilege service permissions"]
    Role --> EC2["Amazon EC2<br/>Lab workload"]

    EC2 --> CW
    EC2 --> SSM

    CT --> S3["Amazon S3<br/>Log storage / evidence storage"]
    CW --> S3

    CW --> Admin
    SSM --> EC2

    subgraph AWS["AWS Account / CloudOps Security Lab"]
        IAM
        Role
        EC2
        CW
        CT
        SSM
        S3
    end
```

## Component Summary

| Component | Purpose |
|---|---|
| User / Admin | Operates the lab through the AWS Console or CLI. |
| IAM | Controls access using users, roles, policies, and least privilege. |
| EC2 | Represents the monitored lab workload. |
| EC2 IAM Role | Allows the EC2 instance to interact with approved AWS services without storing long-term credentials on the instance. |
| CloudWatch | Collects metrics and logs, supports alarms, and provides monitoring visibility. |
| CloudTrail | Records AWS API activity for audit and investigation. |
| S3 | Stores logs, exported evidence, and future lab artifacts. |
| Systems Manager | Provides operational management access, such as Session Manager, where applicable. |

## Notes

- This is a v1 architecture diagram, not the final production design.
- Future versions may add VPC boundaries, public/private subnets, security groups, SNS notifications, CloudWatch Agent details, AWS Config, EventBridge, and Lambda remediation workflows.
- Raw study notes and private mistake logs are intentionally excluded from this public-facing diagram.