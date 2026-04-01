# Load .env file
include .env
export $(shell sed 's/=.*//' .env)

REMOTE=root@$$(cat droplet_ip.txt)
LOCAL_EXTENSION_PATH ?= server/extensions

create-droplet:
	@echo "🚀 Creating droplet $(DROPLET_NAME)..."
	doctl compute droplet create $(DROPLET_NAME) \
		--image $(DROPLET_IMAGE) \
		--size $(DROPLET_SIZE) \
		--region $(DROPLET_REGION) \
		--vpc-uuid $(VPC_UUID) \
		--ssh-keys $(SSH_KEY_ID) \
		--wait \
		--format PublicIPv4 --no-header > droplet_ip.txt

	@DROPLET_IP=$$(cat droplet_ip.txt); \
	echo "✅ Droplet created with IP: $$DROPLET_IP"; \

setup-droplet:
	@echo "⚙️ Installing base dependencies..."
	scp SFS2X.tar.gz $(REMOTE):/root/SFS2X.tar.gz
	scp scripts/install-deps.sh $(REMOTE):/root/install-deps.sh
	ssh $(REMOTE) "bash /root/install-deps.sh"

destroy-droplet:
	@echo "🔥 Destroying droplet $(DROPLET_NAME)..."
	doctl compute droplet delete -f $(DROPLET_NAME)
	rm -f droplet_ip.txt

update-dns:
	@echo "🌍 Updating Route53 DNS for $(DOMAIN_NAME)..."
	IP=$$(cat droplet_ip.txt); \
	aws route53 change-resource-record-sets \
		--hosted-zone-id $(HOSTED_ZONE_ID) \
		--change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"$(DOMAIN_NAME)","Type":"A","TTL":300,"ResourceRecords":[{"Value":"'"$$IP"'"}]}}]}'
	@echo "✅ DNS updated: $(DOMAIN_NAME) → $$(cat droplet_ip.txt)"

setup-https:
	@echo "🔒 Setting up HTTPS with Nginx + Certbot..."
	ssh $(REMOTE) "systemctl enable nginx && systemctl start nginx"
	ssh $(REMOTE) "certbot --nginx -d $(DOMAIN_NAME) --non-interactive --agree-tos -m admin@$(DOMAIN_NAME)"
	@echo "✅ HTTPS successfully configured for https://$(DOMAIN_NAME)"

build-frontend:
	npm run build

deploy-frontend: build-frontend
	@echo "📦 Deploying frontend to $(REMOTE_FRONTEND_PATH)..."
# 	ssh $(REMOTE) "mkdir -p $(REMOTE_FRONTEND_PATH)"
	rsync -avz --delete $(FRONTEND_DIST)/ $(REMOTE):$(REMOTE_FRONTEND_PATH)/
# 	scp nginx.conf $(REMOTE):/etc/nginx/conf.d/default.conf
# 	scp scripts/setup-nginx.sh $(REMOTE):/root/setup-nginx.sh
# 	ssh $(REMOTE) "bash /root/setup-nginx.sh"
	@echo "✅ Frontend deployed successfully!"

deploy-backend:
	@echo "📦 Deploying SmartFoxServer 2X..."
# 	scp -r backend/SFS2X $(REMOTE):$(REMOTE_BACKEND_PATH)
	scp scripts/setup-smartfox.sh $(REMOTE):/root/setup-smartfox.sh
# server
	scp $(LOCAL_SFS)/config/server.xml $(REMOTE):/root/SmartFoxServer_2X/SFS2X/config/server.xml
# deploy zone
	scp $(LOCAL_SFS)/zones/NetCrisis.zone.xml $(REMOTE):/root/SmartFoxServer_2X/SFS2X/zones/NetCrisis.zone.xml
# extensions
	rsync -avz --delete $(LOCAL_SFS)/extensions/NetCrisisExtension/ $(REMOTE):/root/SmartFoxServer_2X/SFS2X/extensions/NetCrisisExtension
	ssh $(REMOTE) "bash /root/setup-smartfox.sh"
	@echo "✅ SmartFoxServer deployed successfully!"

deploy-extension:
	@echo "📦 Deploying SmartFoxServer 2X extension..."
	rsync -avz --delete $(LOCAL_EXTENSION_PATH)/ $(REMOTE):/root/SmartFoxServer_2X/SFS2X/extensions/NetCrisisExtension
	@echo "✅ SmartFoxServer deployed successfully!"

restart-backend:
	ssh $(REMOTE) "systemctl restart sfs2x"
	@echo "♻️ SmartFoxServer restarted."

new-instance-setup: setup-droplet update-dns deploy-frontend deploy-backend
	@echo "✅ Full deployment complete!"