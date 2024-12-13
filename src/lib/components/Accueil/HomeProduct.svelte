<script>
	import { hoverable } from '$UITools/Cursor/cursorHelpers';
	import products from '$stores/productStore';
	import { gsap } from 'gsap';

	let productElements = [];

	function animateProductHover(productElement) {
		// Animer la hauteur
		gsap.to(productElement, {
			height: '300px',
			duration: 0.2,
			ease: 'power1.out'
		});

		// Animer la transparence et la position des autres éléments
		gsap.to(
			productElement.querySelectorAll(
				'.home-product-description, .home-product-informations-price, .home-product-link'
			),
			{
				opacity: 1,
				y: 0,
				duration: 0.3,
				stagger: 0.1
			}
		);

		gsap.to(productElement.querySelector('.home-product-container-right img'), {
			y: 0,
			duration: 0.5,
			ease: 'power1.out'
		});
	}

	function resetProductAnimation(productElement) {
		gsap.to(productElement, {
			height: '80px',
			duration: 0.2,
			ease: 'power1.in'
		});

		gsap.to(
			productElement.querySelectorAll(
				'.home-product-description, .home-product-informations-price, .home-product-link'
			),
			{
				opacity: 0,
				y: 20,
				duration: 0.3
			}
		);

		gsap.to(productElement.querySelector('.home-product-container-right img'), {
			y: '-130%',
			duration: 0.5,
			ease: 'power1.in'
		});
	}
</script>

<section class="about homeProduct" use:hoverable={'footerhover'}>
	{#if $products && Array.isArray($products)}
		{#each $products as product, index (product.id)}
			<div
				class="home-product"
				bind:this={productElements[index]}
				on:mouseenter={() => animateProductHover(productElements[index])}
				on:mouseleave={() => resetProductAnimation(productElements[index])}
			>
				<div class="home-product-container">
					<div class="home-product-container-left">
						<h2 class="home-product-title">
							{product.title}
						</h2>
						<h3 class="home-product-description">
							{product.description}
						</h3>
						<div class="home-product-informations-price">
							{#each product.prices as price}
								<a href={price.link} target="_blank">
									{price.price}€ <sup class="price-cents"> {price.cents} </sup>
									<span class="price-quantity">
										<sup>x</sup>{price.quantity}
									</span>
								</a>
							{/each}
						</div>
						<a class="home-product-link" href={`/product/${product.url}`}> Fiche produit </a>
					</div>
					<div class="home-product-container-right">
						<img
							src={product.imageHome}
							alt="image de la boisson {product.title}"
							srcset={product.imageHome}
							width="100"
							height="273"
						/>
					</div>
				</div>
			</div>
		{/each}
	{/if}
</section>
