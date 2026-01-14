<script lang="ts">
	import Icon from '@iconify/svelte';
	import FBXViewer from '$lib/components/FBXViewer.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<div class="bg">
	<div class="card">
		<h1>Pexisgle</h1>
		<figure class="figure">
			<img
				src="https://avatars.githubusercontent.com/u/248136655?v=4"
				alt="Pexisgle Logo"
				width="200"
			/>
		</figure>
		<p class="affiliation">Science Tokyo High School 科学技術科 情報分野 3年</p>
		<div class="sns">
			{#each data.sns as sns (sns.name)}
				<a
					href={sns.url}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={sns.name}
					style="background: {sns.color}"
				>
					<Icon icon={sns.icon} width="16" height="16" />
				</a>
			{/each}
		</div>
		<p class="description">
			Web開発や競技プログラミングなどから電子工作や映像制作などいろいろやってます。
		</p>
	</div>
	<div class="content">
		<div class="card skil-card">
			<h2>
				<Icon icon="mdi:code-braces" width="32" height="32" />
				Skills
			</h2>
			<div class="skils">
				{#each data.skils as skill (skill.name)}
					<div class="skil">
						{#if skill.icon.startsWith('/') || skill.icon.startsWith('http')}
							<img src={skill.icon} alt={skill.name} />
						{:else}
							<Icon icon={skill.icon} />
						{/if}
						<div class="skil-tooltip">
							<div class="skil-name">{skill.name}</div>
							<div class="skil-confidence">
								{'★'.repeat(skill.confidence)}{'☆'.repeat(5 - skill.confidence)}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
		<div class="card model-card">
			<h2>
				<Icon icon="mdi:cube-outline" width="32" height="32" />
				3D Model
			</h2>
			<div class="model-container">
				<FBXViewer src="/assets/pexisgle.glb" />
			</div>
		</div>
		<div class="card certification-card">
			<div class="sections-wrapper">
				<div class="section">
					<h2>
						<Icon icon="mdi:certificate" width="32" height="32" />
						Certifications
					</h2>
					<div class="items">
						{#if data.certifications.length === 0}
							<div class="empty-message">
								<div class="empty-text">なし (´・ω・`)</div>
							</div>
						{:else}
							{#each data.certifications as certification (certification.name)}
								<div
									class="cert-item"
									class:gold={certification.status === 'Gold'}
									class:silver={certification.status === 'Silver'}
									class:bronze={certification.status === 'Bronze'}
								>
									<div class="cert-icon">
										<Icon icon="mdi:certificate" width="24" height="24" />
									</div>
									<div class="cert-content">
										<div class="cert-name">{certification.name}</div>
										{#if certification.date}
											<div class="cert-date">{certification.date}</div>
										{/if}
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="section">
					<h2>
						<Icon icon="mdi:trophy-award" width="32" height="32" />
						Awards
					</h2>
					<div class="items">
						{#if data.awards.length === 0}
							<div class="empty-message">
								<div class="empty-text">なし (´・ω・`)</div>
							</div>
						{:else}
							{#each data.awards as award (award.name)}
								<div
									class="cert-item award"
									class:gold={award.status === 'Gold'}
									class:silver={award.status === 'Silver'}
									class:bronze={award.status === 'Bronze'}
								>
									<div class="cert-icon">
										<Icon icon="mdi:medal" width="24" height="24" />
									</div>
									<div class="cert-content">
										<div class="cert-name">{award.name}</div>
										{#if award.date}
											<div class="cert-date">{award.date}</div>
										{/if}
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="sass">
@use '$lib/variables.sass' as *

.bg
    display: flex
    gap: $gap-lg
    
    @include respond-to('md', 'max')
        flex-direction: column

.card
    width: 500px
    height: fit-content
    @include glass-card(2rem, $radius-lg)
    overflow: visible
    
    @include respond-to('md', 'max')
        width: 100%
    
    h1
        margin-bottom: 1rem
    figure
        margin-bottom: 1rem
    .affiliation
        font-style: italic
        color: #888
        margin-bottom: 1rem
    .description
        text-align: justify
        margin-bottom: 1rem
    .sns
        display: flex
        gap: $gap-xs
        justify-content: center
        align-items: center
        margin-bottom: 1rem
        a
            display: flex
            align-items: center
            gap: 0.5rem
            padding: .5rem .5rem
            background: $glass-bg-hover
            border: 1px solid $glass-border
            border-radius: $radius-md
            color: #fff
            text-decoration: none
            font-weight: 900
            backdrop-filter: blur(5px)
            @include hover-lift-subtle
    &.skil-card
        text-align: left
        width: 100%
        
        h2
            @include icon-text
            color: #9b59b6
            text-shadow: 0 2px 10px rgba(155, 89, 182, 0.3)

    &.model-card
        text-align: left
        width: 100%
        
        h2
            @include icon-text
            color: #3498db
            text-shadow: 0 2px 10px rgba(52, 152, 219, 0.3)
        
        .model-container
            width: 100%
            border-radius: $radius-md
            overflow: hidden
            background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(41, 128, 185, 0.1) 100%)
            border: 1px solid rgba(52, 152, 219, 0.3)
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2)

    .skils
        display: flex
        gap: $gap-xs
        flex-wrap: wrap
        .skil
            position: relative
            width: 50px
            height: 50px
            color: #fff
            flex-shrink: 0
            cursor: pointer
            display: flex
            align-items: center
            justify-content: center
            
            :global(svg), img
                width: 100%
                height: 100%
                transition: $transition-transform
            img
                border-radius: $radius-sm
            
            &:hover
                z-index: 10
                
                :global(svg)
                    filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.3))
                
                &::before
                    background: rgba(0,0,0, 0.85)
                    left: -10px
                    top: -10px
                    opacity: 1
                    width: 200px
                    height: 70px
                    transition: all 0.3s var(--ease-out)
                
                .skil-tooltip
                    opacity: 1
                    visibility: visible
            
            &::before
                content: ''
                position: absolute
                top: 0
                left: 0
                width: 50px
                height: 50px                
                background: rgba(0,0,0, 0.85)
                border: 1px solid rgba(255, 255, 255, 0.2)
                border-radius: $radius-md
                opacity: 0
                transition: all 0.3s var(--ease-in)
                z-index: -1
                backdrop-filter: blur(5px)
            
            .skil-tooltip
                position: absolute
                width: 70px
                top: 50%
                left: 55px
                transform: translateY(-50%)
                padding: 0.5rem 0.7rem
                border-radius: $radius-sm
                opacity: 0
                white-space: nowrap
                visibility: hidden
                transition: $transition-transform
                pointer-events: none
                display: flex
                flex-direction: column
                align-items: flex-start
                justify-content: center
                
                .skil-name
                    font-weight: bold
                    font-size: 0.8rem
                    margin-bottom: 0.2rem
                    text-align: left
                
                .skil-confidence
                    font-size: 0.7rem
                    letter-spacing: 0.1em
    &.certification-card
        .sections-wrapper
            display: flex
            gap: 1.5rem
            
            @include respond-to('md', 'max')
                flex-direction: column
            
            .section
                flex: 1
                min-width: 0
                
                @include respond-to('md', 'max')
                    margin-bottom: 1rem
                
                h2
                    @include icon-text(0.4rem)
                    color: #4a90e2
                    text-shadow: 0 2px 10px rgba(74, 144, 226, 0.3)
                    margin-bottom: 0.75rem
                    font-size: 1.3rem
                    
                    :global(svg)
                        width: 24px
                        height: 24px
                    
                    &:has(+ .items .cert-item.award)
                        color: #ffd700
                        text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3)
                
                .items
                    display: flex
                    flex-direction: column
                    gap: 0.3rem
            
            .cert-item
                display: flex
                align-items: center
                gap: 0.75rem
                padding: 0.3rem 0.6rem
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)
                border: 1px solid rgba(255, 255, 255, 0.2)
                border-radius: $radius-sm
                transition: $transition-all-normal
                position: relative
                overflow: hidden
                cursor: pointer
                
                &::before
                    content: ''
                    position: absolute
                    top: 0
                    left: 0
                    width: 3px
                    height: 100%
                    background: linear-gradient(180deg, #4a90e2 0%, #357abd 100%)
                    transition: width 0.3s ease
                
                &.award::before
                    background: linear-gradient(180deg, #ffd700 0%, #ffed4e 100%)
                
                &:hover
                    transform: translateX(6px)
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2)
                    border-color: rgba(255, 255, 255, 0.3)
                    
                    &::before
                        width: 4px
                    
                    .cert-icon
                        transform: scale(1.1) rotate(5deg)
                
                .cert-icon
                    flex-shrink: 0
                    width: 36px
                    height: 36px
                    display: flex
                    align-items: center
                    justify-content: center
                    background: linear-gradient(135deg, rgba(74, 144, 226, 0.3) 0%, rgba(53, 122, 189, 0.3) 100%)
                    border-radius: 8px
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
                    color: #4a90e2
                    box-shadow: 0 3px 8px rgba(74, 144, 226, 0.2)
                    
                    :global(svg)
                        width: 20px
                        height: 20px
                
                &.award .cert-icon
                    background: linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 237, 78, 0.3) 100%)
                    color: #ffd700
                    box-shadow: 0 3px 8px rgba(255, 215, 0, 0.3)
                
                .cert-content
                    flex: 1
                    display: flex
                    flex-direction: column
                    gap: 0.1rem
                    
                    .cert-name
                        font-weight: 600
                        font-size: 0.9rem
                        color: #fff
                        line-height: 1.3
                    
                    .cert-date
                        font-size: 0.75rem
                        color: rgba(255, 255, 255, 0.6)
                        font-style: italic
                
                // Gold status
                &.gold
                    &::before
                        background: linear-gradient(180deg, #ffd700 0%, #ffed4e 100%)
                    
                    .cert-icon
                        background: linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 237, 78, 0.3) 100%)
                        color: #ffd700
                        box-shadow: 0 3px 8px rgba(255, 215, 0, 0.3)
                
                // Silver status
                &.silver
                    &::before
                        background: linear-gradient(180deg, #c0c0c0 0%, #e8e8e8 100%)
                    
                    .cert-icon
                        background: linear-gradient(135deg, rgba(192, 192, 192, 0.3) 0%, rgba(232, 232, 232, 0.3) 100%)
                        color: #c0c0c0
                        box-shadow: 0 3px 8px rgba(192, 192, 192, 0.3)
                
                // Bronze status
                &.bronze
                    &::before
                        background: linear-gradient(180deg, #cd7f32 0%, #e8a85f 100%)
                    
                    .cert-icon
                        background: linear-gradient(135deg, rgba(205, 127, 50, 0.3) 0%, rgba(232, 168, 95, 0.3) 100%)
                        color: #cd7f32
                        box-shadow: 0 3px 8px rgba(205, 127, 50, 0.3)
            
            .empty-message
                padding: 2rem 1rem
                text-align: center
                
                .empty-text
                    color: rgba(255, 255, 255, 0.5)
                    font-size: 1rem
                    font-style: italic
                    
.content
    overflow: visible
    width: 100%
    .card
        text-align: left
        margin-bottom: 2rem
        width: 100%

.figure
    margin: 0
    display: inline-flex
    flex-direction: column
    align-items: center

    img
        border-radius: 50%
        border: 4px solid rgba(255, 255, 255, 0.6)
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2)
</style>
