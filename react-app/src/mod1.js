/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState } 	from 'react'
import { Canvas } 																			from 'react-three-fiber'
// eslint-disable-next-line
import * as THREE 																			from "three"
import { Stars, TrackballControls }											from "drei"

const mapSize = 25
let map = []
for (let x = 0; x < mapSize; x++) {
	map[x] = []
	for (let y = 0; y < mapSize; y++) {
		map[x][y] = []
		for (let z = 0; z < mapSize; z++) {
			map[x][y][z] = 'e'
		}
	}
}

function rand(max) {
	return Math.floor(Math.random()*(max+1))
}

function Search(pos, planeRef, meshes) {
	map[pos[0]][pos[1]][pos[2]] = 'visited'
	addPlane([pos[0], pos[1], pos[2]], planeRef, meshes)
	// try to go front
	if (map[pos[0]]?.[pos[1]]?.[pos[2]+1] === 'e') {
		Search([pos[0], pos[1], pos[2]+1], planeRef, meshes)
	}
	// try to go back
	if (map[pos[0]]?.[pos[1]]?.[pos[2]-1] === 'e') {
		Search([pos[0], pos[1], pos[2]-1], planeRef, meshes)
	}
	// try to go right
	if (map[pos[0]+1]?.[pos[1]]?.[pos[2]] === 'e') {
		Search([pos[0]+1, pos[1], pos[2]], planeRef, meshes)
	}
	// try to go left
	if (map[pos[0]-1]?.[pos[1]]?.[pos[2]] === 'e') {
		Search([pos[0]-1, pos[1], pos[2]], planeRef, meshes)
	}
}

function addPlane(pos, planeRef, meshes) {
	let x = pos[0]
	let z = pos[2]
	let newTile = planeRef.current.clone()
	newTile.visible = true
	newTile.material.transparent = true
	newTile.material.opacity = 0.5
	newTile.position.set(x, -0.49, z)
	meshes.current.children.push(newTile)
	map[x][0][z] = 'visited'
}

function Waters(props) {
	const meshes = useRef()
	const boxTemplate = useRef()
	const { iteration } = props
	
	/*
	let timeElapsed = 0
	useFrame((e, delta) => {
		timeElapsed += delta
		if (timeElapsed > 0.05) {
			if (iteration) {
				// move water
			}

			timeElapsed = 0
		}
	})
	*/

	useEffect(() => {
		if (iteration) {
			Search([12, 0, 12], boxTemplate, meshes)
		}
	}, [iteration])

	return (<>
		<mesh ref={boxTemplate} rotation={[4.71239, 0, 0]} visible={false}>
			<planeBufferGeometry attach="geometry" args={[1, 1]} />
			<meshStandardMaterial attach="material" color="#67C23A" />
		</mesh>
		<mesh ref={meshes}>
			
		</mesh>
		<mesh position={[12, 0, 12]}>
			<boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
			<meshStandardMaterial attach="material" color="yellow" />
		</mesh>
	</>)
}

function Grounds(props) {
	const [tiles, setTiles] = useState([])

	useEffect(() => {
		const initTiles = []
		for (const x in map) {
			for (const y in map[x]) {
				for (const z in map[x][y]) {
					if (map[x][y][z] === 'ground')
						initTiles.push({x: x, y: y, z: z})
				}
			}
		}
		setTiles(initTiles)
	}, [])

	return (<>
		<mesh>
			{Object.keys(tiles).map((k, i) => (
				<mesh
				position={[tiles[k].x, tiles[k].y, tiles[k].z]}
				key={i}
				>
					<boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
					<meshStandardMaterial attach="material" color="#F56C6C"/>
				</mesh>
			))}
		</mesh>
	</>)
}

function Plane() {
	return (<>
			<mesh rotation={[4.71239, 0, 0]} position={[mapSize/2-0.5, -0.5, mapSize/2-0.5]}>
				<planeBufferGeometry attach="geometry" args={[mapSize, mapSize]} />
				<meshStandardMaterial attach="material" color="#737CA1" />
			</mesh>
		
	</>)
}

export default function Mod1() {
	const [iteration, setIteration] = useState(false)
	const [raining, setRaining] = useState(0)
	const [waving, setWaving] = useState(0)
	const [eruption, setEruption] = useState(0)
	const [totalWater, setTotalWater] = useState(0)
	const [totalGround, setTotalGround] = useState(0)
	
	useEffect(() => {
		/*
		let copyMap = JSON.parse(JSON.stringify(map))
		copyMap[0][0][0] = 'ground'
		copyMap[0][2][0] = 'ground'
		copyMap[2][2][2] = 'ground'
		copyMap[0][4][0] = 'ground'
		copyMap[4][4][0] = 'ground'
		copyMap[0][4][4] = 'ground'
		
		let map2 = []
		for (let x = 0; x < mapSize; x++) {
			map2[x] = []
			for (let z = 0; z < mapSize; z++) {
				map2[x][z] = copyMap[x][4][z]
				if (copyMap[x][4][z] === 'ground')
					map[x][4][z] = 'ground'
			}
		}
		console.log('testing', map2)
		*/

		
		let expectedGround = (mapSize*mapSize)/2
		while (expectedGround-- > 0) {
			map[rand(mapSize-1)][0][rand(mapSize-1)] = 'ground'
		}
		
		map[12][0][12] = 'e'

		// count tiles
		let water = 0
		let ground = 0
		for (const x of map) {
			for (const y of x) {
				for (const z of y) {
					if (z === 'water')
						water++
					else if (z === 'ground')
						ground++
				}
			}
		}
		setTotalWater(water)
		setTotalGround(ground)
		//console.log('map', map)
	}, [])
	
	
	return (
		<div style={{width: '100%', height: window.innerHeight}} >
			<button onClick={() => setIteration(!iteration)} style={{position: 'absolute', zIndex: 10000}} type="button">Iteration!</button>
			<button onClick={() => setRaining(!raining)} style={{position: 'absolute', zIndex: 10000, marginLeft: 72}} type="button">Raining!</button>
			<button onClick={() => setWaving(!waving)} style={{position: 'absolute', zIndex: 10000, marginLeft: 142}} type="button">Waving!</button>
			<button onClick={() => setEruption(!eruption)} style={{position: 'absolute', zIndex: 10000, marginLeft: 212}} type="button">Eruption!</button>
			<button onClick={() => console.log(map)} style={{position: 'absolute', zIndex: 10000, marginLeft: -50}} type="button">Map!</button>
			<p style={{color: '#409EFF', position: 'absolute', zIndex: 10000, right: 5, marginTop: -2, fontSize: 17}}>{totalWater}</p>
			<p style={{color: '#67C23A', position: 'absolute', zIndex: 10000, right: 5, marginTop: 20, fontSize: 17}}>{totalGround}</p>
			<Canvas colorManagement>
				<pointLight intensity={0.45} distance={mapSize*2} color="#fff" position={[Math.floor(mapSize/2), mapSize+5, Math.floor(mapSize/2)]}/>
				{
				<pointLight intensity={0.45} distance={mapSize*2} color="#fff" position={[Math.floor(mapSize/2), Math.floor(mapSize/2), Math.floor(mapSize/2)]}/>
				}
				
				<Waters iteration={iteration} raining={raining} waving={waving} eruption={eruption}/>
				<Grounds/>
				{/*
				*/}
				

				<Plane />

				<gridHelper args={[mapSize, mapSize, `white`, `#409EFF`]} position={[mapSize/2-0.5, -0.5, mapSize/2-0.5]}/>
				<Stars />

				<TrackballControls />
			</Canvas>
		</div>
	)
}
