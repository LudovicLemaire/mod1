/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState, useMemo } 	from 'react'
import { Canvas } 																			from 'react-three-fiber'
// eslint-disable-next-line
import * as THREE 																			from "three"
import { Stars, TrackballControls }											from "drei"

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

function MoveWater(iteration, meshes) {
	//iterate through water to move
	//console.time('Move Water')
	for (const waterUnit of meshes.children) {
		const xPos = Number(waterUnit.position.x)
		const yPos = Number(waterUnit.position.y)
		const zPos = Number(waterUnit.position.z)

		let goDown = 0
		let goLeft = 0
		let goRight = 0
		let goFront = 0
		let goBack = 0
		let moveTo = []

		if (map[xPos]?.[yPos-1]?.[zPos] === 'e') { // check if bottom is clear
			goDown = 1
		} else if (map[xPos]?.[yPos+1]?.[zPos] === 'water') { // check if water on top
			if (map[xPos+1]?.[yPos]?.[zPos] === 'e') { // check if right is clear
				goRight = 1
			} else if (map[xPos-1]?.[yPos]?.[zPos] === 'e') { // check if left is clear
				goLeft = 1
			} else if (map[xPos]?.[yPos]?.[zPos+1] === 'e') { // check if front is clear
				goFront = 1
			} else if (map[xPos]?.[yPos]?.[zPos-1] === 'e') { // check if back is clear
				goBack = 1
			}
		} else if (map[xPos]?.[yPos-1]?.[zPos] === 'water' || map[xPos]?.[yPos-1]?.[zPos] === 'ground') {// try to slide
			let continueRight = true
			let continueLeft = true
			let continueFront = true
			let continueBack = true
			let positionFound = false
			let i = 0
			while ((continueRight || continueLeft || continueFront || continueBack) && !positionFound) {
				++i
				if (map[xPos+i]?.[yPos]?.[zPos] === 'e') {
					if (map[xPos+i]?.[yPos-1]?.[zPos] === 'e') {
						moveTo = [xPos+i, yPos-1, zPos]
						positionFound = true
					}
				} else {
					continueRight = false
				}
				if (map[xPos-i]?.[yPos]?.[zPos] === 'e') {
					if (map[xPos-i]?.[yPos-1]?.[zPos] === 'e') {
						moveTo = [xPos-i, yPos-1, zPos]
						positionFound = true
					}
				} else {
					continueLeft = false
				}
				if (map[xPos]?.[yPos]?.[zPos+i] === 'e') {
					if (map[xPos]?.[yPos-1]?.[zPos+i] === 'e') {
						moveTo = [xPos, yPos-1, zPos+i]
						positionFound = true
					}
				} else {
					continueFront = false
				}
				if (map[xPos]?.[yPos]?.[zPos-i] === 'e') {
					if (map[xPos]?.[yPos-1]?.[zPos-i] === 'e') {
						moveTo = [xPos, yPos-1, zPos-i]
						positionFound = true
					}
				} else {
					continueBack = false
				}
			}
		}





		if (goDown) {
			if (yPos - goDown < 0) // Protect from having invalid value
				continue;
			map[xPos][yPos][zPos] = 'e'
			waterUnit.position.x = xPos
			waterUnit.position.y = yPos - goDown
			waterUnit.position.z = zPos
			map[waterUnit.position.x][waterUnit.position.y][waterUnit.position.z] = 'water'
		}
		if (goLeft || goRight || goBack || goFront) {
			if (xPos - goLeft < 0 || xPos + goRight > mapSize-1) // Protect from having invalid value
				continue;
			if (zPos - goBack < 0 || zPos + goFront > mapSize-1) // Protect from having invalid value
				continue;
				map[xPos][yPos][zPos] = 'e'
				waterUnit.position.x = xPos + goRight - goLeft
				waterUnit.position.y = yPos
				waterUnit.position.z = zPos + goFront - goBack
				map[waterUnit.position.x][waterUnit.position.y][waterUnit.position.z] = 'water'
		}
		/*
		if (moveTo.length === 3) {
			map[xPos][yPos][zPos] = 'e'
			waterUnit.position.x = moveTo[0]
			waterUnit.position.y = moveTo[1]
			waterUnit.position.z = moveTo[2]
			map[waterUnit.position.x][waterUnit.position.y][waterUnit.position.z] = 'water'
		}*/
	}
	//console.timeEnd('Move Water')
}

function Waters(props) {
	const meshes = useRef()
	const [tiles, setTiles] = useState([])
	const { iteration } = props
	
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

	useEffect(() => {
		if (iteration > 0) {
			MoveWater(iteration, meshes.current)
		}
	}, [iteration])

	return (<>
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
	const [iteration, setIteration] = useState(0)
	const [totalWater, setTotalWater] = useState(0)
	const [totalGround, setTotalGround] = useState(0)
	
	useEffect(() => {
	
		for (const x in slopezMap) {
			for (const y in slopezMap[x]) {
				map[x][Math.floor(slopezMap[x][y])][y] = 'ground'
			}

		}
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

		/*
		// feel great map
		let xg = mapSize-2
		while (xg > 0) {
			let zg = mapSize-2
			while (zg > 0) {
				map[xg][Math.floor(mapSize/2)-2][zg] = 'ground'
				--zg
			}
			--xg
		}
		
		xg = mapSize-1
		while (xg >= 0) {
			let zg = mapSize-1
			while (zg >= 0) {
				map[xg][Math.floor(mapSize/2)-5][zg] = 'ground'
				--zg
			}
			--xg
		}
		map[12][Math.floor(mapSize/2)-5][12] = 'e'
		map[12][Math.floor(mapSize/2)-5][11] = 'e'
		map[11][Math.floor(mapSize/2)-5][12] = 'e'
		map[11][Math.floor(mapSize/2)-5][11] = 'e'
		*/

		// fill with water
		let expectedWater = (mapSize*mapSize)*5
		while (expectedWater-- > 0) {
			const x = rand(mapSize-1)
			const y = rand(mapSize-1)
			const z = rand(mapSize-1)
			if (y > mapSize - mapSize/4)
				map[x][y][z] = 'water'
		}

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
		console.log('map', map)
	}, [])
	
	
	return (
		<div style={{width: '100%', height: window.innerHeight}} >
			<button onClick={() => setIteration(iteration+1)} style={{position: 'absolute', zIndex: 10000}} type="button">Iteration!</button>
			<button onClick={() => console.log(map)} style={{position: 'absolute', zIndex: 10000, marginLeft: -50}} type="button">Map!</button>
			<p style={{color: '#409EFF', position: 'absolute', zIndex: 10000, right: 5, marginTop: -2, fontSize: 17}}>{totalWater}</p>
			<p style={{color: '#67C23A', position: 'absolute', zIndex: 10000, right: 5, marginTop: 20, fontSize: 17}}>{totalGround}</p>
			<Canvas colorManagement>
				<ambientLight intensity={0.45} color="#fff"/>

				<Waters iteration={iteration}/>
				<Grounds/>
				{/*
				*/}
				

				<Plane />
				<SimulationLimit />

				<gridHelper args={[mapSize, mapSize, `white`, `#409EFF`]} position={[mapSize/2-0.5, -0.5, mapSize/2-0.5]}/>
				<gridHelper args={[mapSize, mapSize, `white`, `#67C23A`]} rotation={[1.5708, 0, 0]} position={[mapSize/2-0.5, mapSize/2-0.5, -0.5]}/>
				<Stars />

				<TrackballControls />
			</Canvas>
		</div>
	)
}
