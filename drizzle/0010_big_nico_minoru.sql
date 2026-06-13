CREATE TABLE `oauth_pkce_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`state` varchar(64) NOT NULL,
	`codeVerifier` varchar(128) NOT NULL,
	`callbackUrl` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `oauth_pkce_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `oauth_pkce_data_state_unique` UNIQUE(`state`)
);
