CREATE TABLE `alertas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`botId` int,
	`jogo` varchar(255) NOT NULL,
	`liga` varchar(255),
	`mercado` varchar(255) NOT NULL,
	`odd` decimal(8,2) NOT NULL,
	`ev` decimal(8,2),
	`confianca` int NOT NULL,
	`motivos` json,
	`resultado` enum('pendente','green','red','void') NOT NULL DEFAULT 'pendente',
	`enviado` boolean NOT NULL DEFAULT false,
	`canaisEnviados` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apostas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertaId` int,
	`jogo` varchar(255) NOT NULL,
	`mercado` varchar(255) NOT NULL,
	`odd` decimal(8,2) NOT NULL,
	`stake` decimal(12,2) NOT NULL,
	`resultado` enum('pendente','green','red','void') NOT NULL DEFAULT 'pendente',
	`lucro` decimal(12,2),
	`roi` decimal(8,2),
	`dataJogo` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apostas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bancas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`valorTotal` decimal(12,2) NOT NULL DEFAULT '1000.00',
	`valorAtual` decimal(12,2) NOT NULL DEFAULT '1000.00',
	`stopLoss` decimal(5,2) NOT NULL DEFAULT '20.00',
	`stopGain` decimal(5,2) NOT NULL DEFAULT '50.00',
	`kellyFracao` decimal(3,2) NOT NULL DEFAULT '0.25',
	`ativa` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bancas_id` PRIMARY KEY(`id`),
	CONSTRAINT `bancas_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `bots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`templateId` varchar(100),
	`ativo` boolean NOT NULL DEFAULT false,
	`confiancaMinima` int NOT NULL DEFAULT 70,
	`limiteDiario` int NOT NULL DEFAULT 10,
	`totalSinais` int NOT NULL DEFAULT 0,
	`totalAcertos` int NOT NULL DEFAULT 0,
	`regras` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `canais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tipo` enum('whatsapp_evolution','whatsapp_zapi','telegram','email','push') NOT NULL,
	`nome` varchar(255) NOT NULL,
	`ativo` boolean NOT NULL DEFAULT false,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `canais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pitacos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jogo` varchar(255) NOT NULL,
	`liga` varchar(255),
	`mercado` varchar(255) NOT NULL,
	`odd` decimal(8,2) NOT NULL,
	`analise` text,
	`confianca` int NOT NULL DEFAULT 70,
	`resultado` enum('pendente','green','red','void') NOT NULL DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pitacos_id` PRIMARY KEY(`id`)
);
