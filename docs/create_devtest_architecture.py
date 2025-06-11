#!/usr/bin/env python3
"""
AWS TAK Base Infrastructure Architecture Diagram (Dev-Test)
Creates a professional architecture diagram using AWS icons for the cost-optimized dev-test configuration
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
diagram_name = "tak-base-infrastructure-dev-test"

try:
    print("🔄 Creating TAK Base Infrastructure - Dev-Test Architecture Diagram")
    
    # Create the diagram with larger spacing for bigger subnets
    with Diagram(
        "TAK Base Infrastructure - Dev-Test",
        filename=f"{output_path}/{diagram_name}",
        show=False,
        direction="TB",
        graph_attr={
            "fontsize": "20",
            "bgcolor": "white",
            "pad": "1.0",
            "splines": "ortho",
            "nodesep": "1.5",
            "ranksep": "2.0",
            "size": "16,12"
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
        
        # AWS Region - following AWS documentation style
        with Cluster("Region", graph_attr={
            "bgcolor": "white", 
            "style": "solid", 
            "color": "#232F3E", 
            "fontsize": "14",
            "fontname": "Arial Bold",
            "penwidth": "2"
        }):
            
            # VPC Container - green background as per AWS docs
            with Cluster("VPC", graph_attr={
                "bgcolor": "#E8F4E8", 
                "style": "solid", 
                "color": "#2E7D32", 
                "fontsize": "12",
                "fontname": "Arial Bold",
                "penwidth": "2"
            }):
                
                # Internet Gateway - at VPC level
                igw = InternetGateway("Internet Gateway")
                
                # Availability Zone A - dashed border as per AWS docs
                with Cluster("Availability Zone A", graph_attr={
                    "bgcolor": "transparent", 
                    "style": "dashed", 
                    "color": "#1976D2", 
                    "fontsize": "11",
                    "fontname": "Arial",
                    "penwidth": "2",
                    "margin": "20"
                }):
                    
                    # Public Subnet A - enlarged for more space
                    with Cluster("Public subnet", graph_attr={
                        "bgcolor": "#E3F2FD", 
                        "style": "solid", 
                        "color": "#1976D2", 
                        "fontsize": "10",
                        "penwidth": "1",
                        "margin": "30",
                        "minlen": "2"
                    }):
                        pub_subnet_a = PublicSubnet("")
                        nat_a = NATGateway("NAT Gateway")
                    
                    # Private Subnet A - enlarged for more space
                    with Cluster("Private subnet", graph_attr={
                        "bgcolor": "#F3E5F5", 
                        "style": "solid", 
                        "color": "#7B1FA2", 
                        "fontsize": "10",
                        "penwidth": "1",
                        "margin": "30",
                        "minlen": "2"
                    }):
                        priv_subnet_a = PrivateSubnet("")
                        rt_priv_a = RouteTable("Route Table")
                    
                # Availability Zone B - dashed border as per AWS docs
                with Cluster("Availability Zone B", graph_attr={
                    "bgcolor": "transparent", 
                    "style": "dashed", 
                    "color": "#1976D2", 
                    "fontsize": "11",
                    "fontname": "Arial",
                    "penwidth": "2",
                    "margin": "20"
                }):
                    
                    # Public Subnet B - enlarged for more space
                    with Cluster("Public subnet", graph_attr={
                        "bgcolor": "#E3F2FD", 
                        "style": "solid", 
                        "color": "#1976D2", 
                        "fontsize": "10",
                        "penwidth": "1",
                        "margin": "30",
                        "minlen": "2"
                    }):
                        pub_subnet_b = PublicSubnet("")
                    
                    # Private Subnet B - enlarged for more space
                    with Cluster("Private subnet", graph_attr={
                        "bgcolor": "#F3E5F5", 
                        "style": "solid", 
                        "color": "#7B1FA2", 
                        "fontsize": "10",
                        "penwidth": "1",
                        "margin": "30",
                        "minlen": "2"
                    }):
                        priv_subnet_b = PrivateSubnet("")
                        rt_priv_b = RouteTable("Route Table")
                    
                # Public Route Table - at VPC level
                rt_public = RouteTable("Public Route Table")
                
                # VPC Endpoints - minimal for dev-test
                with Cluster("VPC Endpoints", graph_attr={
                    "bgcolor": "#FFF8E1", 
                    "style": "solid", 
                    "color": "#F57C00", 
                    "fontsize": "10",
                    "penwidth": "1"
                }):
                    vpc_s3 = S3("S3 Gateway Endpoint")
            
            # AWS Services - outside VPC
            with Cluster("AWS Services", graph_attr={
                "bgcolor": "#FFF3E0", 
                "style": "solid", 
                "color": "#E65100", 
                "fontsize": "12",
                "fontname": "Arial Bold",
                "penwidth": "2"
            }):
                
                # Compute Services
                with Cluster("Compute", graph_attr={
                    "bgcolor": "#E1F5FE", 
                    "style": "solid", 
                    "color": "#0277BD", 
                    "fontsize": "10",
                    "penwidth": "1"
                }):
                    ecs_cluster = ECS("ECS Cluster")
                    ecr_repo = ECR("ECR Repository")
                
                # Storage & Security
                with Cluster("Storage & Security", graph_attr={
                    "bgcolor": "#FCE4EC", 
                    "style": "solid", 
                    "color": "#C2185B", 
                    "fontsize": "10",
                    "penwidth": "1"
                }):
                    s3_bucket = S3("S3 Bucket")
                    kms_key = KMS("KMS Key")
        
        # Network Connections
        internet >> Edge(label="IPv4/IPv6", color="blue") >> igw
        
        # Public subnet connections
        igw >> rt_public
        rt_public >> pub_subnet_a
        rt_public >> pub_subnet_b
        
        # NAT Gateway connections (only one NAT Gateway in dev-test)
        pub_subnet_a >> nat_a
        
        # Private subnet routing (both route through single NAT Gateway A)
        nat_a >> rt_priv_a >> priv_subnet_a
        nat_a >> Edge(style="dashed", color="red", label="shared NAT") >> rt_priv_b >> priv_subnet_b
        
        # S3 Gateway endpoint to route tables (free)
        rt_priv_a >> Edge(style="dashed", color="green", label="S3 Gateway (Free)") >> vpc_s3
        rt_priv_b >> Edge(style="dashed", color="green") >> vpc_s3
        
        # Service interconnections
        ecs_cluster >> Edge(style="dotted", color="blue", label="pulls images\nvia NAT Gateway") >> ecr_repo
        s3_bucket >> Edge(style="dotted", color="purple", label="encrypted by") >> kms_key
        
        # Cost optimization note - remove this complex cluster
        # Simple text note instead

    print(f"✅ Architecture diagram generated: {output_path}/{diagram_name}.png")
    print(f"💰 Dev-Test configuration optimizations:")
    print(f"   • Single NAT Gateway (shared) saves ~$32/month vs prod")
    print(f"   • No VPC Interface Endpoints saves ~$23/month vs prod")
    print(f"   • S3 Gateway Endpoint only (free)")
    print(f"   • Less fault tolerant but cost-effective for development")
    print(f"   • Total estimated cost: ~$35/month")
    
except Exception as e:
    print(f"❌ Error creating diagram: {e}")
    traceback.print_exc()
    sys.exit(1)
