# S3 Bucket for Static Website Hosting
resource "aws_s3_bucket" "static_hosting" {
  bucket = "${local.name_prefix}-static-hosting"

  tags = {
    Name        = "${local.name_prefix}-static-hosting"
    Environment = var.environment
    Application = var.app_name
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "static_hosting" {
  bucket = aws_s3_bucket.static_hosting.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket Website Configuration
resource "aws_s3_bucket_website_configuration" "static_hosting" {
  bucket = aws_s3_bucket.static_hosting.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# S3 Bucket Policy for Public Read
resource "aws_s3_bucket_policy" "static_hosting" {
  bucket = aws_s3_bucket.static_hosting.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.static_hosting.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.static_hosting]
}
