<script>
	import '@fontsource-variable/open-sans';
	import '@fontsource-variable/raleway';
</script>

<section class="welcome rcc">
	<div class="containerText max-w-xl">
		<h1 class="title">Custom your can</h1>

		<p class="paragraph">
			Bienvenue à l'atelier custom. Personnalisez votre boisson énergisante haut de gamme avec votre
			logo et design favori, transformant chaque canette en un accessoire unique. Commandez dès
			aujourd'hui pour faire impression lors de vos événements ou au quotidien.
		</p>

		<p class="paragraph-mobile">
			Rendez-vous sur votre ordinateur pour profiter de l'atelier de personnalisation en ligne.
		</p>

		<div class="buttonsContainer rcs">
			<div class="holder"></div>

			<div class="buttonsContainer-box css h-[200px] ml-5">
				<div class="linkButton mb-5">
					<input
						type="file"
						name="fileLoader[]"
						id="fileLoader"
						class="fileLoader fileLoader-2"
						multiple
					/>
					<label class="labeldowload" for="fileLoader">
						<div class="rcc p-2">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="17" viewBox="0 0 20 17">
								<path
									d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3 11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8 2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z"
								/>
							</svg>
							<span class="labeldowloadtext">UPLOAD</span>
						</div>
					</label>
				</div>

				<button class="linkButton mb-5">
					<a href="/tuto"> Tuto </a>
				</button>
			</div>
		</div>
	</div>

	<div class="containerCan ccc"></div>
</section>

<style lang="scss">
	.welcome {
		width: 100%;
		display: flex;
		flex-direction: row;
		overflow: hidden;

		.containerText {
			position: absolute;
			left: 50px;
			.title {
				text-align: center;
				font-family: 'Open Sans Variable', sans-serif;
				font-style: italic;
				text-align: center;
				font-size: 57px;
				-webkit-text-stroke: 1px black;
				color: transparent;
				text-transform: uppercase;
				font-weight: 900;
			}

			.paragraph {
				text-align: justify;
				font-family: 'Open Sans Variable', sans-serif;
				font-weight: 500;
				font-size: 18px;
			}

			.paragraph-mobile {
				text-align: justify;
				font-family: 'Open Sans Variable', sans-serif;
				font-weight: 500;
			}

			.linkButton {
				font-family: 'Open Sans Variable', sans-serif;
				font-weight: 500;
			}

			.labeldowloadtext {
				font-family: 'Open Sans Variable', sans-serif;
				font-weight: 500;
			}

			.buttonsContainer {
				margin-top: 20px;
				.holder {
					text-align: center;
					font-weight: 700;
					text-transform: uppercase;
					border: 7px dashed rgb(0, 0, 0);
					width: 200px;
					height: 200px;
					background-image: url('/dragdrop.png');
					background-position: center;
					background-size: contain;
					z-index: 5;
					padding: 17px;
					transition: all 0.25s ease;

					&:hover {
						border: 7px dashed #53b2ff;
						cursor: grab;
					}
				}
			}

			.fileLoader-2 {
				display: none;
			}

			.fileLoader + label {
				font-size: 1.25rem;
				/* 20px */
				font-weight: 700;
				text-overflow: ellipsis;
				white-space: nowrap;
				cursor: pointer;
				display: inline-block;
				overflow: hidden;
				font-size: 18px;
				font-weight: 400;
				text-align: justify;
				text-transform: uppercase;
				font-family: opensansregular;
				width: 204px;
				text-align: center;
				padding: 10px 0px;
			}

			.fileLoader:focus + label,
			.fileLoader.has-focus + label {
				outline: -webkit-focus-ring-color auto 5px;
			}

			.fileLoader + label * {
				transition: all 0.25s;

				&:hover {
					color: #53b2ff;
				}
			}

			.fileLoader + label svg {
				width: 1em;
				height: 1em;
				vertical-align: middle;
				fill: currentColor;
				margin-top: -0.25em;
				/* 4px */
				margin-right: 0.25em;
				/* 4px */
			}

			.fileLoader-2 + label {
				color: #000000;
			}

			.fileLoader-2:focus + label,
			.fileLoader-2.has-focus + label,
			.fileLoader-2 + label:hover {
				color: #2b2b2b;
			}
		}

		.containerCan {
			height: 100vh;
			width: 80vw;
			position: absolute;
			right: 0;
			top: 0;
		}
	}
</style>
