/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState, useMemo } 	from 'react'
import { Canvas, useFrame } 																			from 'react-three-fiber'
// eslint-disable-next-line
import * as THREE 																			from "three"
import { Stars,  OrbitControls}											from "drei"

import slopezMap from "./map.json"

const mapSize = 50
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

// Fisher-Yates (aka Knuth) Shuffle
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1
    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }
  return array
}

function Search(cpMap, pos) {
	cpMap[pos[0]][pos[2]] = 'visited'
	if (map[pos[0]]?.[pos[1]-1]?.[pos[2]] === 'e')
		return pos
	
	let r = []
	const tryGo = [[pos[0], pos[1], pos[2]+1], [pos[0], pos[1], pos[2]-1], [pos[0]+1, pos[1], pos[2]], [pos[0]-1, pos[1], pos[2]]]
	shuffle(tryGo)
	if (map[tryGo[0][0]]?.[tryGo[0][1]]?.[tryGo[0][2]] === 'e' && cpMap[tryGo[0][0]]?.[tryGo[0][2]] !== 'visited') {
		if ((r = Search(cpMap, tryGo[0])) && r.length) {
			return r
		}
	}
	if (map[tryGo[1][0]]?.[tryGo[1][1]]?.[tryGo[1][2]] === 'e' && cpMap[tryGo[1][0]]?.[tryGo[1][2]] === 'e') {
		if ((r = Search(cpMap, tryGo[1])) && r.length) {
			return r
		}
	}
	if (map[tryGo[2][0]]?.[tryGo[2][1]]?.[tryGo[2][2]] === 'e' && cpMap[tryGo[2][0]]?.[tryGo[2][2]] === 'e') {
		if ((r = Search(cpMap, tryGo[2])) && r.length) {
			return r
		}
	}
	if (map[tryGo[3][0]]?.[tryGo[3][1]]?.[tryGo[3][2]] === 'e' && cpMap[tryGo[3][0]]?.[tryGo[3][2]] === 'e') {
		if ((r = Search(cpMap, tryGo[3])) && r.length) {
			return r
		}
	}
	return []
}

function MoveWater(meshes) {
	//iterate through water to move
	//console.time('Move Water')
	for (const waterUnit of meshes.children) {
		const xPos = Number(waterUnit.position.x)
		const yPos = Number(waterUnit.position.y)
		const zPos = Number(waterUnit.position.z)

		let goDown = 0
		let phase2 = []
		let phase2multi = []
		let phase3 = []
		let phase3multi = []

		if (map[xPos]?.[yPos-1]?.[zPos] === 'e') { // check if bottom is clear // phase 1
			goDown = 1
		} else if (map[xPos]?.[yPos+1]?.[zPos] === 'water') { // check if water on top // phase 2
			if (map[xPos+1]?.[yPos]?.[zPos] === 'e') { // check if right is clear
				phase2multi.push([xPos + 1, yPos, zPos])
			} else if (map[xPos-1]?.[yPos]?.[zPos] === 'e') { // check if left is clear
				phase2multi.push([xPos - 1, yPos, zPos])
			} else if (map[xPos]?.[yPos]?.[zPos+1] === 'e') { // check if front is clear
				phase2multi.push([xPos, yPos, zPos + 1])
			} else if (map[xPos]?.[yPos]?.[zPos-1] === 'e') { // check if back is clear
				phase2multi.push([xPos, yPos, zPos - 1])
			}
			if (phase2multi.length > 0) { // choose a direction randomly through possibilities
				phase2 = phase2multi[rand(phase2multi.length-1)]
			}
		} else if (map[xPos]?.[yPos-1]?.[zPos] === 'water' || map[xPos]?.[yPos-1]?.[zPos] === 'ground') {// try to slide // phase 3
			if (map[xPos+1]?.[yPos]?.[zPos] === 'e' || map[xPos-1]?.[yPos]?.[zPos] === 'e' || map[xPos]?.[yPos]?.[zPos+1] === 'e' || map[xPos]?.[yPos]?.[zPos-1] === 'e') {
				let r = []
				let cpMap = []
				for (let x = 0; x < mapSize; x++) {
					cpMap[x] = []
					for (let z = 0; z < mapSize; z++) {
						cpMap[x][z] = map[x][yPos][z]
					}
				}
				r = Search(cpMap, [xPos, yPos, zPos])
				if (r.length)
					phase3 = r
			}
			
		}





		if (goDown) { // phase 1
			if (yPos - goDown < 0) // Protect from having invalid value
				continue;
			map[xPos][yPos][zPos] = 'e'
			waterUnit.position.x = xPos
			waterUnit.position.y = yPos - goDown
			waterUnit.position.z = zPos
			map[waterUnit.position.x][waterUnit.position.y][waterUnit.position.z] = 'water'
		} else if (phase2.length === 3) { // phase 2
			if (phase2[0] < 0 || phase2[0] > mapSize-1)// Protect from having invalid value
				continue;
			if (phase2[2] < 0 || phase2 > mapSize-1)// Protect from having invalid value
				continue;
			map[xPos][yPos][zPos] = 'e'
			waterUnit.position.x = phase2[0]
			waterUnit.position.y = phase2[1]
			waterUnit.position.z = phase2[2]
			map[waterUnit.position.x][waterUnit.position.y][waterUnit.position.z] = 'water'
		} else if (phase3.length === 3) { // phase 3
			map[xPos][yPos][zPos] = 'e'
			waterUnit.position.x = phase3[0]
			waterUnit.position.y = phase3[1]-1
			waterUnit.position.z = phase3[2]
			map[waterUnit.position.x][waterUnit.position.y][waterUnit.position.z] = 'water'
		}
	}
	//console.timeEnd('Move Water')
}

function Waters(props) {
	const meshes = useRef()
	const boxTemplate = useRef()
	const [tiles, setTiles] = useState([])
	const { iteration, raining, waving, eruption } = props

	useEffect(() => {
		const initTiles = []
		for (const x in map) {
			for (const y in map[x]) {
				for (const z in map[x][y]) {
					if (map[x][y][z] === 'water')
						initTiles.push({x: x, y: y, z: z})
				}
			}
		}
		setTiles(initTiles)
	}, [])
	
	useEffect(() => {
		if (meshes.current) {
			for (const water of meshes.current.children) {
				water.material.transparent = true
				water.material.opacity = 0.5
			}
		}
	}, [meshes, tiles])
	
	let timeElapsed = 0
	useFrame((e, delta) => {
		timeElapsed += delta
		if (timeElapsed > 0.05) {
			if (iteration) {
				MoveWater(meshes.current)
			}

			if (raining) {
				let rainingNb = 2
				while (rainingNb--) {
					let x = rand(mapSize-1); let y = mapSize-1; let z = rand(mapSize-1);
					if (map[x][y][z] === 'e') {
						let newTile = boxTemplate.current.clone()
						newTile.visible = true
						newTile.material.transparent = true
						newTile.material.opacity = 0.5
						newTile.position.set(x, y, z)
						meshes.current.children.push(newTile)
						map[x][y][z] = 'water'
					}
				}
			}

			if (waving) {
				let x = 0
				let y = 0
				let z = 0
				
				while (y < mapSize) {
					x = 0
					while (x < mapSize) {
						if (map[x][y][z] === 'e') {
							let newTile = boxTemplate.current.clone()
							newTile.visible = true
							newTile.material.transparent = true
							newTile.material.opacity = 0.5
							newTile.position.set(x, y, z)
							meshes.current.children.push(newTile)
							map[x][y][z] = 'water'
						}
						++x
					}
					++y
				}
			}

			if (eruption) {
				let spawnPoints = [[15, 0, 12], [3, 0, 12]]
				for (const p of spawnPoints) {
					while (1) {
						if (map[p[0]]?.[p[1]]?.[p[2]] === 'water' || map[p[0]]?.[p[1]]?.[p[2]] === 'ground') {
							p[1]++
						} else if (map[p[0]]?.[p[1]]?.[p[2]] === 'e') {
							let newTile = boxTemplate.current.clone()
							newTile.visible = true
							newTile.material.transparent = true
							newTile.material.opacity = 0.5
							newTile.position.set(p[0], p[1], p[2])
							meshes.current.children.push(newTile)
							map[p[0]][p[1]][p[2]] = 'water'
							break;
						} else {
							break;
						}
					}
				}
			}

			timeElapsed = 0
		}
	})

	return (<>
		<mesh ref={boxTemplate} position={[0, 0, 0]} visible={false}>
			<boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
			<meshStandardMaterial attach="material" color="#409EFF" />
		</mesh>
		<mesh ref={meshes}>
			{Object.keys(tiles).map((k, i) => (
				<mesh
					position={[tiles[k].x, tiles[k].y, tiles[k].z]}
					key={i}
				>
					<boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
					<meshStandardMaterial attach="material" color="#409EFF" />
				</mesh>
			))}
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
					<meshStandardMaterial attach="material" color="#67C23A"/>
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

function SimulationLimit() {
	const geom = useMemo(() => new THREE.PlaneBufferGeometry(mapSize, mapSize))
	return (<>
		<mesh rotation={[0, 0, 0]} position={[mapSize/2-0.5, mapSize/2-0.5, -0.49]}>
			<lineSegments>
				<edgesGeometry attach="geometry" args={[geom]} />
				<lineBasicMaterial color="#f00" attach="material" />
			</lineSegments>
		</mesh>
		
	</>)
}

export default function Mod1() {
	const orbit = useRef()
	const [iteration, setIteration] = useState(false)
	const [raining, setRaining] = useState(0)
	const [waving, setWaving] = useState(0)
	const [eruption, setEruption] = useState(0)
	const [totalWater, setTotalWater] = useState(0)
	const [totalGround, setTotalGround] = useState(0)
	
	useEffect(() => {
		
		
		

		/*
		// fill with grounds
		let expectedGround = (mapSize*mapSize)
		while (expectedGround-- > 0) {
			const x = rand(mapSize-1)
			const y = rand(mapSize-1)
			const z = rand(mapSize-1)
			if (y < mapSize - mapSize/2)
				map[x][y][z] = 'ground'
		}
		*/

		// fill with water
		/*
		let expectedWater = (mapSize*mapSize)*5
		while (expectedWater-- > 0) {
			const x = rand(mapSize-1)
			const y = rand(mapSize-1)
			const z = rand(mapSize-1)
			if (y > mapSize - mapSize/4)
				map[x][y][z] = 'water'
		}
		*/

		/*
		// wave
		let x1 = 0
		let y1 = 0
		let z1 = 0
		while (x1 < mapSize/4) {
			y1 = 0
			while (y1 < mapSize) {
				z1 = 0
				while (z1 < mapSize) {
					map[x1][y1][z1] = 'water'
					++z1
				}
				++y1
			}
			++x1
		}
		*/

		
		// fill synlo map
		for (const x in slopezMap) {
			for (const y in slopezMap[x]) {
				for (const z in slopezMap[x][y]) {
					if (slopezMap[x][y][z] === 1)
						if (x < mapSize && y < mapSize && z < mapSize)
							map[x][z][y] = 'ground'
				}
			}
		}
		

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
				{/*
				<pointLight intensity={0.45} distance={mapSize*2} color="#fff" position={[Math.floor(mapSize/2), Math.floor(mapSize/2), Math.floor(mapSize/2)]}/>
				*/}
				
				<Waters iteration={iteration} raining={raining} waving={waving} eruption={eruption}/>
				<Grounds/>
				{/*
				*/}
				

				<Plane />
				<SimulationLimit />

				<gridHelper args={[mapSize, mapSize, `white`, `#409EFF`]} position={[mapSize/2-0.5, -0.5, mapSize/2-0.5]}/>
				<gridHelper args={[mapSize, mapSize, `white`, `#67C23A`]} rotation={[1.5708, 0, 0]} position={[mapSize/2-0.5, mapSize/2-0.5, -0.5]}/>
				<Stars />

				<OrbitControls ref={orbit} />
			</Canvas>
		</div>
	)
}
