#!/bin/bash
set -e

echo "⚙️ Setting up SmartFoxServer as systemd service..."

cat >/etc/systemd/system/sfs2x.service <<EOF
[Unit]
Description=SmartFoxServer 2X
After=network.target

[Service]
Type=forking
User=root
LimitNOFILE=100000
WorkingDirectory=/root/SmartFoxServer_2X/SFS2X
ExecStart=/root/SmartFoxServer_2X/SFS2X/sfs2x-service start
ExecStop=/root/SmartFoxServer_2X/SFS2X/sfs2x-service stop
Restart=on-abort

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sfs2x
systemctl start sfs2x
echo "✅ SmartFoxServer 2X service started."
