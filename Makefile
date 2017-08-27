##################################################################
#
#  Makefile for building tabiiku-batch and packaging docker image.
#
#  General usage:
#    - make help
#    - make build
#    - make test ENV_FILE_PATH=env/example.env
#    - make package ENV_FILE_PATH=env/example.env
#    - make deploy ENV_FILE_PATH=env/example.env
#    - make destroy ENV_FILE_PATH=env/example.env
#    - make clean
#
##################################################################
include $(ENV_FILE_PATH)
export $$(shell sed 's/=.*//' $(ENV_FILE_PATH))

.PHONY: help build test package deploy destroy clean
.DEFAULT_GOAL := help

build: dependency-dev ## Install all dependencies including development packages

test: validate-envvars validate dependency-dev lint-code unit-test ## Validating and linting CloudFormation templates and Lambda functions (requires: ENV_FILE_PATH)

validate-envvars: # Test if required environment variables exist
ifeq ($(GITHUB_REPOSITORY_URL),)
	$(error missing the 'GITHUB_REPOSITORY_URL' environment variable, or 'ENV_FILE_PATH' does not exist)
endif
ifeq ($(GITHUB_PERSONAL_ACCESS_TOKEN),)
	$(error missing the 'GITHUB_PERSONAL_ACCESS_TOKEN' environment variable, or 'ENV_FILE_PATH' does not exist)
endif
ifeq ($(GITHUB_TARGET_RESOURCE),)
	$(error missing the 'GITHUB_TARGET_RESOURCE' environment variable, or 'ENV_FILE_PATH' does not exist)
endif
ifeq ($(AWS_DEFAULT_REGION),)
	$(error missing the 'AWS_DEFAULT_REGION' environment variable, or 'ENV_FILE_PATH' does not exist)
endif
ifeq ($(CODEBUILD_PROJECT_NAME),)
	$(error missing the 'CODEBUILD_PROJECT_NAME' environment variable, or 'ENV_FILE_PATH' does not exist)
endif
ifeq ($(CODEBUILD_PROJECT_REGION),)
	$(error missing the 'CODEBUILD_PROJECT_REGION' environment variable, or 'ENV_FILE_PATH' does not exist)
endif

validate:
	@./scripts/validate $(ENV_FILE_PATH)

dependency:
	@./scripts/dependency production

dependency-dev:
	@./scripts/dependency

lint-code:
	@./scripts/lint

unit-test:
	@./scripts/test

package: validate-envvars validate clean dependency package-sam ## Install all dependencies and package stuffs (requires: ENV_FILE_PATH)

package-sam:
ifeq ($(S3_SAM_ARTIFACTS_BUCKET_NAME),)
	$(error missing the 'S3_SAM_ARTIFACTS_BUCKET_NAME' environment variable, or 'ENV_FILE_PATH' does not exist)
endif
	@./scripts/package $(S3_SAM_ARTIFACTS_BUCKET_NAME) $(CODEBUILD_PROJECT_NAME)

deploy: package deploy-sam ## Deploy github-codebuild-integration into your AWS account (requires: ENV_FILE_PATH)

deploy-sam:
ifeq ($(S3_SAM_ARTIFACTS_BUCKET_NAME),)
	$(error missing the 'S3_SAM_ARTIFACTS_BUCKET_NAME' environment variable, or 'ENV_FILE_PATH' does not exist)
endif
	@./scripts/deploy $(ENV_FILE_PATH)

destroy: ## Remove provisioned resources from your AWS account (requires: ENV_FILE_PATH)
	@./scripts/destroy $(ENV_FILE_PATH)

clean: ## Remove local generated files and installed dependencies
	@./scripts/clean

help: ## Show this
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'