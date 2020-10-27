/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState, useMemo } 	from 'react'
import { Canvas } 												from 'react-three-fiber'
// eslint-disable-next-line
import * as THREE 																															from "three"
import { Stars, TrackballControls }															from "drei"

const mapSize = 25
let map = []
for (let i = 0; i < mapSize; i++) {
	map[i] = []
	for (let y = 0; y < mapSize; y++) {
		map[i][y] = 'e'
	}
}

function rand(max) {
	return Math.floor(Math.random()*(max+1))
}

function MoveWater(iteration, meshes) {
	//iterate through water to move
	console.time('Move Water')
	for (const waterUnit of meshes.children) {
		let xPos = Number(waterUnit.position.x)
		let yPos = Number(waterUnit.position.y)
		let isBOk = 0 // down
		let isROk = 0 // right
		let isLOk = 0 // left
		let moveTo = []

		if (map[xPos][yPos-1] === 'e') { // check if bottom is clear
			isBOk = 1
		} else if (map[xPos][yPos+1] === 'water') { // check if above is water tile
			if (map[xPos+1]?.[yPos] === 'e') { // check if right is clear
				if (map[xPos-1]?.[yPos] === 'e') { // check if left is also clear
					if (Math.random() >= 0.5)
						isROk = 1
					else
						isLOk = 1
				} else {
					isROk = 1
				}
			}
			else if (map[xPos-1]?.[yPos] === 'e') { // check if left is clear
				isLOk = 1
			}
		} else if (map[xPos][yPos-1] === 'water' || map[xPos][yPos-1] === 'ground') {// try to slide
			let continueRight = true
			let continueLeft = true
			let positionFound = false
			let i = 0
			while ((continueRight || continueLeft) && !positionFound) {
				++i
				if (map[xPos+i]?.[yPos] === 'e') {
					if (map[xPos+i]?.[yPos-1] === 'e') {
						moveTo = [xPos+i, yPos-1]
						positionFound = true
					}
				} else {
					continueRight = false
				}
				if (map[xPos-i]?.[yPos] === 'e') {
					if (map[xPos-i]?.[yPos-1] === 'e') {
						if (positionFound && Math.random() >= 0.5) {
							moveTo = [xPos-i, yPos-1]
						} else {
							moveTo = [xPos-i, yPos-1]
						}
						positionFound = true
					}
				} else {
					continueLeft = false
				}
			}
		}
		
		if (isBOk || isROk || isLOk) {
			if (xPos - isLOk + isROk > mapSize-1 || xPos + isROk < 0 || // check if x is not out of map
				yPos - isBOk < 0 ) { // check if y is not out of map 
				
			} else {
				map[xPos][yPos] = 'e'
				waterUnit.position.x = xPos-isLOk+isROk
				waterUnit.position.y = yPos-isBOk
				map[waterUnit.position.x][waterUnit.position.y] = 'water'
			}
		} else if (moveTo.length === 2) {
			map[xPos][yPos] = 'e'
			waterUnit.position.x = moveTo[0]
			waterUnit.position.y = moveTo[1]
			map[waterUnit.position.x][waterUnit.position.y] = 'water'
		}
	}
	console.timeEnd('Move Water')
}

function Waters(props) {
	const meshes = useRef()
	const [tiles, setTiles] = useState([])
	const { iteration } = props
	
	useEffect(() => {
		const initTiles = []
		for (const x in map) {
			for (const y in map[x]) {
				if (map[x][y] === 'water')
					initTiles.push({x: x, y: y})
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
					position={[tiles[k].x, tiles[k].y, 0]}
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
				if (map[x][y] === 'ground')
					initTiles.push({x: x, y: y})
			}
		}
		setTiles(initTiles)
	}, [])

	return (<>
		<mesh>
			{Object.keys(tiles).map((k, i) => (
				<mesh
					position={[tiles[k].x, tiles[k].y, 0]}
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
			<mesh rotation={[4.71239, 0, 0]} position={[12, -0.5, 0]}>
				<planeBufferGeometry attach="geometry" args={[25, 25]} />
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
		// fill with grounds
		let expectedGround = (mapSize*mapSize)/12
		while (expectedGround-- > 0) {
			map[rand(mapSize-1)][rand(mapSize-1)] = 'ground'
		}
		// fill with water
		let expectedWater = (mapSize*mapSize)/3
		while (expectedWater-- > 0) {
			map[rand(mapSize-1)][rand(mapSize-1)] = 'water'
		}

		// count tiles
		let water = 0
		let ground = 0
		for (const x of map) {
			for (const y of x) {
				if (y === 'water')
					water++
				else if (y === 'ground')
					ground++
			}
		}
		setTotalWater(water)
		setTotalGround(ground)
		console.log('map', map)
	}, [])
	
	
	return (
		<div style={{width: '100%', height: '754px'}} >
			<button onClick={() => setIteration(iteration+1)} style={{position: 'absolute', zIndex: 10000}} type="button">Iteration!</button>
			<button onClick={() => console.log(map)} style={{position: 'absolute', zIndex: 10000, marginLeft: -50}} type="button">Map!</button>
			<p style={{color: '#409EFF', position: 'absolute', zIndex: 10000, right: 5, marginTop: -2, fontSize: 17}}>{totalWater}</p>
			<p style={{color: '#67C23A', position: 'absolute', zIndex: 10000, right: 5, marginTop: 20, fontSize: 17}}>{totalGround}</p>
			<Canvas colorManagement>
				<ambientLight intensity={0.45} color="#fff"/>

				<Waters iteration={iteration}/>
				<Grounds/>

				<Plane />
				<SimulationLimit />

				<gridHelper args={[25, 25, `white`, `#409EFF`]} position={[12, -0.5, 0]}/>
				<gridHelper args={[25, 25, `white`, `#67C23A`]} rotation={[1.5708, 0, 0]} position={[12, 12, -0.5]}/>
				<Stars />
				
				<TrackballControls />
			</Canvas>
		</div>
	)
}
