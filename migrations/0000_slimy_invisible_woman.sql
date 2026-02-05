CREATE TABLE `community_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `community_comments_id` PRIMARY KEY(`id`)
);

CREATE TABLE `community_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `community_likes_id` PRIMARY KEY(`id`)
);

CREATE TABLE `community_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`room_id` int NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `community_messages_id` PRIMARY KEY(`id`)
);

CREATE TABLE `community_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`content` text NOT NULL,
	`image_url` varchar(500),
	`likes_count` int DEFAULT 0,
	`comments_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `community_posts_id` PRIMARY KEY(`id`)
);

CREATE TABLE `community_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`type` varchar(20) DEFAULT 'public',
	`icon` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `community_rooms_id` PRIMARY KEY(`id`)
);

CREATE TABLE `consent_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couple_id` int NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`consent_target` varchar(100) NOT NULL,
	`is_granted` boolean DEFAULT false,
	`timestamp` timestamp DEFAULT (now()),
	CONSTRAINT `consent_logs_id` PRIMARY KEY(`id`)
);

CREATE TABLE `couples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partner1_id` varchar(36) NOT NULL,
	`partner2_id` varchar(36) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`mode` varchar(20) DEFAULT 'romantic',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `couples_id` PRIMARY KEY(`id`)
);

CREATE TABLE `cycle_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp,
	`symptoms` json,
	`flow_intensity` varchar(20),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `cycle_logs_id` PRIMARY KEY(`id`)
);

CREATE TABLE `game_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couple_id` int NOT NULL,
	`game_type` varchar(50) NOT NULL,
	`current_step` int DEFAULT 1,
	`game_state` json DEFAULT ('{}'),
	`intensity` varchar(20) NOT NULL DEFAULT 'playful',
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `game_sessions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `gifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`receiver_id` varchar(36) NOT NULL,
	`gift_type` varchar(50) NOT NULL,
	`credit_value` int NOT NULL,
	`status` varchar(20) DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `gifts_id` PRIMARY KEY(`id`)
);

CREATE TABLE `likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_user_id` varchar(36) NOT NULL,
	`to_user_id` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `likes_id` PRIMARY KEY(`id`)
);

CREATE TABLE `memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couple_id` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text,
	`type` varchar(20) DEFAULT 'text',
	`media_url` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `memories_id` PRIMARY KEY(`id`)
);

CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couple_id` int NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`content` text NOT NULL,
	`type` varchar(20) DEFAULT 'text',
	`is_explicit` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);

CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`bio` text,
	`gender` varchar(50),
	`orientation` varchar(100),
	`interests` json DEFAULT ('[]'),
	`relationship_goals` varchar(100),
	`is_public` boolean DEFAULT true,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`)
);

CREATE TABLE `security_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`event_type` varchar(50) NOT NULL,
	`severity` varchar(20) DEFAULT 'low',
	`details` text,
	`ip_address` varchar(45),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `security_audits_id` PRIMARY KEY(`id`)
);

CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`sex_style` varchar(50),
	`boundaries` json DEFAULT ('[]'),
	`fantasies` json DEFAULT ('[]'),
	`intensity_preference` int DEFAULT 1,
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`)
);

CREATE TABLE `wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`type` varchar(30) NOT NULL,
	`status` varchar(20) DEFAULT 'completed',
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `withdrawal_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`payment_method` varchar(50) NOT NULL,
	`payment_details` json NOT NULL,
	`status` varchar(20) DEFAULT 'pending',
	`processed_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `withdrawal_requests_id` PRIMARY KEY(`id`)
);

CREATE TABLE `sessions` (
	`sid` varchar(128) NOT NULL,
	`sess` json NOT NULL,
	`expire` timestamp NOT NULL,
	CONSTRAINT `sessions_sid` PRIMARY KEY(`sid`)
);

CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255),
	`first_name` varchar(100),
	`last_name` varchar(100),
	`profile_image_url` varchar(500),
	`is_age_verified` boolean DEFAULT false,
	`role` varchar(20) DEFAULT 'user',
	`credits` int DEFAULT 0,
	`invite_code` varchar(10),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_invite_code_unique` UNIQUE(`invite_code`)
);

ALTER TABLE `community_comments` ADD CONSTRAINT `community_comments_post_id_community_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `community_comments` ADD CONSTRAINT `community_comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `community_likes` ADD CONSTRAINT `community_likes_post_id_community_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `community_likes` ADD CONSTRAINT `community_likes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `community_messages` ADD CONSTRAINT `community_messages_room_id_community_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `community_rooms`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `community_messages` ADD CONSTRAINT `community_messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `community_posts` ADD CONSTRAINT `community_posts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `consent_logs` ADD CONSTRAINT `consent_logs_couple_id_couples_id_fk` FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `consent_logs` ADD CONSTRAINT `consent_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `couples` ADD CONSTRAINT `couples_partner1_id_users_id_fk` FOREIGN KEY (`partner1_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `couples` ADD CONSTRAINT `couples_partner2_id_users_id_fk` FOREIGN KEY (`partner2_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `cycle_logs` ADD CONSTRAINT `cycle_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `game_sessions` ADD CONSTRAINT `game_sessions_couple_id_couples_id_fk` FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `gifts` ADD CONSTRAINT `gifts_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `gifts` ADD CONSTRAINT `gifts_receiver_id_users_id_fk` FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `likes` ADD CONSTRAINT `likes_from_user_id_users_id_fk` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `likes` ADD CONSTRAINT `likes_to_user_id_users_id_fk` FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `memories` ADD CONSTRAINT `memories_couple_id_couples_id_fk` FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `messages` ADD CONSTRAINT `messages_couple_id_couples_id_fk` FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `security_audits` ADD CONSTRAINT `security_audits_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `withdrawal_requests` ADD CONSTRAINT `withdrawal_requests_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);