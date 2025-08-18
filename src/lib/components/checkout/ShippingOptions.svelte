<script lang="ts">
	import * as Card from '$shadcn/card/index.js';
	import { Package, Home, MapPin, CheckCircle, XCircle } from 'lucide-svelte';

	interface Props {
		shippingOptions: any[];
		selectedShippingOption: string | null;
		onShippingOptionSelect: (option: any) => void;
		hasCustomItems: boolean;
	}

	let { shippingOptions, selectedShippingOption, onShippingOptionSelect, hasCustomItems } = $props();

	// Helper function to group shipping options by type
	function groupShippingOptions(options: any[]) {
		const grouped: { type: string; options: any[] }[] = [];
		const servicePointOptions: any[] = [];
		const homeDeliveryOptions: any[] = [];

		options.forEach(option => {
			if (option.functionalities?.last_mile === 'service_point') {
				servicePointOptions.push(option);
			} else {
				homeDeliveryOptions.push(option);
			}
		});

		if (servicePointOptions.length > 0) {
			grouped.push({ type: 'service_point', options: servicePointOptions });
		}
		if (homeDeliveryOptions.length > 0) {
			grouped.push({ type: 'home_delivery', options: homeDeliveryOptions });
		}

		return grouped;
	}
</script>

{#if shippingOptions.length > 0}
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Package class="w-5 h-5" />
				Options de livraison
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				{#each groupShippingOptions(shippingOptions) as group}
					<div class="space-y-3">
						<!-- En-tête du groupe -->
						<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							{#if group.type === 'service_point'}
								<MapPin class="w-4 h-4" />
								Point relais
							{:else}
								<Home class="w-4 h-4" />
								Livraison à domicile
							{/if}
						</div>
						
						<!-- Options du groupe -->
						{#each group.options as option (option.code)}
							<div
								class="flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
							>
								<input
									id={option.code}
									type="radio"
									name="shippingOption"
									value={option.code}
									checked={selectedShippingOption === option.code}
									onchange={() => onShippingOptionSelect(option)}
									class="h-4 w-4 border-primary"
								/>
								<label for={option.code} class="flex-1 cursor-pointer">
									<div class="flex items-center justify-between">
										<div class="flex-1">
											<div class="font-medium">{option.carrier.name}</div>
											<div class="text-sm text-muted-foreground">
												{option.product.name}
											</div>
											
											<!-- 🎯 INDICATEURS DE NUANCES pour UPS -->
											{#if option.carrier.name === 'UPS'}
												<div class="flex items-center gap-2 mt-2">
													{#if option.functionalities?.signature}
														<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
															<CheckCircle class="w-3 h-3 mr-1" />
															Avec signature
														</span>
													{:else}
														<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
															<XCircle class="w-3 h-3 mr-1" />
															Sans signature
														</span>
													{/if}
													
													{#if option.functionalities?.last_mile === 'service_point'}
														<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
															<MapPin class="w-3 h-3 mr-1" />
															Point relais
														</span>
													{:else}
														<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
															<Home class="w-3 h-3 mr-1" />
															Domicile
														</span>
													{/if}
												</div>
												
												<!-- 📝 DESCRIPTION DÉTAILLÉE UPS -->
												<div class="mt-2 text-xs text-muted-foreground">
													{#if option.functionalities?.signature}
														<p>✓ Livraison avec signature obligatoire - Plus sécurisé</p>
													{:else}
														<p>✓ Livraison sans signature - Plus flexible</p>
													{/if}
													
													{#if option.product.name.includes('Express')}
														<p>✓ Service express - Livraison rapide (1-2 jours ouvrés)</p>
													{:else if option.product.name.includes('Standard')}
														<p>✓ Service standard - Livraison économique (2-3 jours ouvrés)</p>
													{/if}
												</div>
											{/if}
											
											<!-- 📝 DESCRIPTION pour autres transporteurs -->
											{#if option.carrier.name === 'Chronopost'}
												<div class="mt-2 text-xs text-muted-foreground">
													{#if option.product.name.includes('Express')}
														<p>✓ Service express - Livraison en 24h</p>
													{:else if option.product.name.includes('Relais')}
														<p>✓ Point relais - Retrait en point de collecte</p>
													{:else}
														<p>✓ Service standard - Livraison en 2-3 jours</p>
													{/if}
												</div>
											{:else if option.carrier.name === 'Colissimo'}
												<div class="mt-2 text-xs text-muted-foreground">
													{#if option.functionalities?.signature}
														<p>✓ Livraison avec signature obligatoire</p>
													{:else}
														<p>✓ Livraison sans signature</p>
													{/if}
												</div>
											{:else if option.carrier.name === 'Mondial Relay'}
												<div class="mt-2 text-xs text-muted-foreground">
													<p>✓ Point relais - Retrait en point de collecte</p>
													{#if option.product.name.includes('QR')}
														<p>✓ Code QR pour retrait simplifié</p>
													{/if}
												</div>
											{/if}
										</div>
										
										<!-- Prix -->
										<div class="text-right">
											<div class="text-lg font-bold">
												{option.quotes?.[0]?.price?.total?.value
													? option.quotes[0].price.total.value + ' €'
													: 'Prix indisponible'}
											</div>
											{#if option.quotes?.[0]?.lead_time}
												<div class="text-xs text-muted-foreground">
													{option.quotes[0].lead_time} jour(s)
												</div>
											{/if}
										</div>
									</div>
								</label>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
{:else if hasCustomItems}
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Package class="w-5 h-5" />
				Livraison - Commandes personnalisées
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
				<p class="text-sm text-blue-700 dark:text-blue-300">
					📦 <strong>Commande personnalisée détectée</strong><br/>
					Les commandes avec canettes personnalisées ne nécessitent pas de frais de livraison.
					Votre commande sera traitée sans coût de transport supplémentaire.
				</p>
			</div>
		</Card.Content>
	</Card.Root>
{/if}
