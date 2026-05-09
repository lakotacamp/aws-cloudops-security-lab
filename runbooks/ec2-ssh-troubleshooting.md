# EC2 SSH Troubleshooting Runbook

## Purpose
This runbook explains how to troubleshoot an EC2 instance that cannot be reached over SSH.

## Scenario
A user reports that they cannot connect to an EC2 instance using SSH.

Example error messages may include:

- `Connection timed out`
- `Permission denied (publickey)`
- `Connection refused`
- `Host key verification failed`

---

## Quick Triage Checklist

### 1. Confirm the instance is running
- Go to the EC2 console.
- Check that the instance state is `running`.
- Check that status checks are passing.

### 2. Confirm the correct public IP or DNS name
- Verify that the user is connecting to the current public IPv4 address or public DNS name.
- If the instance was stopped and started, the public IP may have changed.

### 3. Check the security group
- Confirm inbound rule allows SSH:
  - Type: SSH
  - Protocol: TCP
  - Port: 22
  - Source: your IP address or approved CIDR range

### 4. Check the network ACL
- Confirm inbound and outbound rules allow traffic on port 22.
- Confirm ephemeral return traffic is allowed.

### 5. Check route table and subnet
- If connecting from the public internet, confirm the instance is in a public subnet.
- The subnet route table should have a route to an Internet Gateway:
  - `0.0.0.0/0 -> igw-...`

### 6. Confirm the instance has a public IP
- The instance needs a public IPv4 address or Elastic IP for direct SSH from the internet.

### 7. Confirm the correct key pair
- Make sure the private key matches the key pair attached when the instance was launched.
- On Linux/macOS, check permissions:
  - `chmod 400 key-name.pem`

### 8. Confirm the correct username
Common usernames:

- Amazon Linux: `ec2-user`
- Ubuntu: `ubuntu`
- Debian: `admin`
- RHEL: `ec2-user` or `root`
- CentOS: `centos`

### 9. Check local firewall or VPN issues
- Try a different network if needed.
- Confirm local firewall/security software is not blocking SSH.

### 10. Use EC2 Instance Connect or Systems Manager Session Manager if available
- If SSH fails, try AWS-native connection methods.
- Systems Manager requires the SSM Agent and an IAM role with proper permissions.

---

## Likely Root Causes

| Symptom | Likely Cause |
|---|---|
| Connection timed out | Security group, NACL, route table, public IP, or network path issue |
| Permission denied | Wrong key pair, wrong username, or bad key permissions |
| Connection refused | SSH service may not be running on the instance |
| Host key verification failed | Known hosts mismatch after instance replacement or IP reuse |

---

## Resolution Notes
Document the actual root cause here after troubleshooting.

## Lessons Learned
Add what you learned from the issue here.