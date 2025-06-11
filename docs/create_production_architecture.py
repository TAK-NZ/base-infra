#!/usr/bin/env python3
"""
AWS TAK Base Infrastructure Architecture Diagram (Production)
Creates a professional architecture diagram using AWS icons
"""

import sys
import traceback

try:
    from diagrams import Diagram, Cluster, Edge
    from diagrams.aws.compute import ECS, ECR
    from diagrams.aws.network import PrivateSubnet, PublicSubnet, InternetGateway, NATGateway, RouteTable
    from diagrams.aws.storage import S3
    from diagrams.aws.security import KMS
    from diagrams.aws.general import InternetAlt1
    print("✅ All imports successful")
except Exception as e:
    print(f"❌ Import error: {e}")
    traceback.print_exc()
    sys.exit(1)

# Configuration
output_path = "/home/ubuntu/GitHub/TAK-NZ/base-infra/docs"
diagram_name = "tak-base-infrastructure-prod"

print("🔄 Creating TAK Base Infrastructure - Production Architecture Diagram")

try:
    # Create the diagram
    with Diagram(
        "TAK Base Infrastructure - Production",
        filename=f"{output_path}/{diagram_name}",
        show=False,
        direction="TB",
        graph_attr={
            "fontsize": "20",
            "bgcolor": "white",
            "pad": "0.5",
            "splines": "ortho",
            "nodesep": "0.8",
            "ranksep": "1.2"
        },
        node_attr={
            "fontsize": "11",
            "fontname": "Arial"
        },
        edge_attr={
            "fontsize": "9"
        }
    ):
        
        # External Internet
        internet = InternetAlt1("Internet")
        
        with Cluster("AWS Region", graph_attr={"bgcolor": "#e8f4f8", "style": "rounded", "fontsize": "14"}):
            
            with Cluster("VPC (10.x.x.0/20)\n4,096 IP Addresses", graph_attr={"bgcolor": "#d4edda", "style": "rounded", "fontsize": "12"}):
                
                # Internet Gateway
                igw = InternetGateway("Internet Gateway\n(IPv4/IPv6)")
                
                # Availability Zone A
                with Cluster("Availability Zone A", graph_attr={"bgcolor": "#fff3cd", "style": "rounded", "fontsize": "11"}):
                    pub_subnet_a = PublicSubnet("Public Subnet A\n10.x.x.0/24")
                    priv_subnet_a = PrivateSubnet("Private Subnet A\n10.x.x.64/26")
                    nat_a = NATGateway("NAT Gateway A\n+ Elastic IP")
                    rt_priv_a = RouteTable("Private RT A")
                    
                # Availability Zone B
                with Cluster("Availability Zone B", graph_attr={"bgcolor": "#fff3cd", "style": "rounded", "fontsize": "11"}):
                    pub_subnet_b = PublicSubnet("Public Subnet B\n10.x.x.16/24")
                    priv_subnet_b = PrivateSubnet("Private Subnet B\n10.x.x.80/26")
                    nat_b = NATGateway("NAT Gateway B\n+ Elastic IP")
                    rt_priv_b = RouteTable("Private RT B")
                    
                # Public Route Table
                rt_public = RouteTable("Public Route Table")
                
                # VPC Endpoints (Production Only)
                with Cluster("VPC Endpoints (Prod Only)", graph_attr={"bgcolor": "#f8d7da", "style": "rounded", "fontsize": "11"}):
                    vpc_s3 = S3("S3 Gateway\nEndpoint")
                    vpc_ecr_dkr = S3("ECR DKR\nInterface")
                    vpc_ecr_api = S3("ECR API\nInterface") 
                    vpc_kms = KMS("KMS\nInterface")
                    vpc_secrets = S3("Secrets Mgr\nInterface")
                    vpc_logs = S3("CloudWatch\nInterface")
            
            # Compute Services
            with Cluster("Compute Services", graph_attr={"bgcolor": "#e1f5fe", "style": "rounded", "fontsize": "12"}):
                ecs_cluster = ECS("ECS Cluster\n(Fargate)")
                ecr_repo = ECR("ECR Repository\nContainer Images")
            
            # Storage & Security
            with Cluster("Storage & Security", graph_attr={"bgcolor": "#f3e5f5", "style": "rounded", "fontsize": "12"}):
                s3_bucket = S3("S3 Config Bucket\nKMS Encrypted")
                kms_key = KMS("KMS Key & Alias\nEncryption")
        
        # Network Connections
        internet >> Edge(label="IPv4/IPv6", color="blue") >> igw
        
        # Public subnet connections
        igw >> rt_public
        rt_public >> pub_subnet_a
        rt_public >> pub_subnet_b
        
        # NAT Gateway connections
        pub_subnet_a >> nat_a
        pub_subnet_b >> nat_b
        
        # Private subnet routing
        nat_a >> rt_priv_a >> priv_subnet_a
        nat_b >> rt_priv_b >> priv_subnet_b
        
        # VPC Endpoint connections to private subnets (simplified to avoid clutter)
        priv_subnet_a >> Edge(style="dashed", color="orange", label="VPC Endpoints") >> vpc_ecr_dkr
        priv_subnet_b >> Edge(style="dashed", color="orange") >> vpc_ecr_api
        
        # S3 Gateway endpoint to route tables
        rt_priv_a >> Edge(style="dashed", color="green", label="S3 Gateway") >> vpc_s3
        rt_priv_b >> Edge(style="dashed", color="green") >> vpc_s3
        
        # Service interconnections
        ecs_cluster >> Edge(style="dotted", color="blue", label="pulls images") >> ecr_repo
        s3_bucket >> Edge(style="dotted", color="purple", label="encrypted by") >> kms_key

        print(f"✅ Architecture diagram generated: {output_path}/{diagram_name}.png")
        print(f"📊 Production configuration includes:")
        print(f"   • Dual NAT Gateways for high availability (~$65/month)")
        print(f"   • 6 VPC Endpoints for secure AWS service access (~$23/month)")
        print(f"   • IPv4/IPv6 dual-stack networking")
        print(f"   • KMS-encrypted S3 storage (~$1/month)")
        print(f"   • ECS Fargate cluster with ECR integration")
        print(f"   • Total estimated cost: ~$91/month")
        
except Exception as e:
    print(f"❌ Error creating diagram: {e}")
    traceback.print_exc()
    sys.exit(1)
